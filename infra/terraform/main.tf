provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  standard_labels = {
    application = "deployment-readiness-auditor"
    environment = "production"
    owner       = "platform-security"
    cost_center = "devsecops-gatekeeper"
    managed_by  = "terraform"
  }
}

# 1. Dedicated Least-Privilege Runtime Service Account (CIS GCP 4.1 / Zero Default SA)
resource "google_service_account" "dra_runtime" {
  account_id   = "${var.service_name}-runtime-sa"
  display_name = "DRA v3.0 Cloud Run Least-Privilege Runtime Identity"
}

# 2. Managed Secrets in Google Secret Manager (Never pass keys in plaintext env vars)
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = var.gemini_api_key_secret_id
  labels    = local.standard_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "session_hmac" {
  secret_id = var.session_secret_id
  labels    = local.standard_labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_iam_member" "gemini_key_accessor" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.dra_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "session_hmac_accessor" {
  secret_id = google_secret_manager_secret.session_hmac.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.dra_runtime.email}"
}

# 3. Cloud Run v2 Serverless Service
resource "google_cloud_run_v2_service" "dra" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"
  labels   = local.standard_labels

  template {
    service_account                  = google_service_account.dra_runtime.email
    max_instance_request_concurrency = 40
    timeout                          = "120s"

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = var.container_image

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
        cpu_idle = true
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "LLM_MODEL"
        value = var.llm_model
      }

      env {
        name  = "ALLOW_STATIC_FALLBACK"
        value = "true"
      }

      env {
        name = "API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "SESSION_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.session_hmac.secret_id
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 2
        period_seconds        = 5
        failure_threshold     = 6
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        period_seconds = 30
      }
    }
  }

  depends_on = [
    google_secret_manager_secret_iam_member.gemini_key_accessor,
    google_secret_manager_secret_iam_member.session_hmac_accessor
  ]
}

# Optional public invoker binding for interactive Web UI deployments (use IAM/IAP when false)
resource "google_cloud_run_v2_service_iam_member" "public_web_ui" {
  count    = var.allow_public_invoker ? 1 : 0
  project  = google_cloud_run_v2_service.dra.project
  location = google_cloud_run_v2_service.dra.location
  name     = google_cloud_run_v2_service.dra.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 4. Keyless GitHub Actions Workload Identity Federation (Eliminates static SA keys in CI/CD)
resource "google_iam_workload_identity_pool" "github_pool" {
  count                     = var.github_repository != "" ? 1 : 0
  workload_identity_pool_id = "${var.service_name}-gh-pool"
  display_name              = "GitHub Actions OIDC Pool for DRA"
}

resource "google_iam_workload_identity_pool_provider" "github_provider" {
  count                              = var.github_repository != "" ? 1 : 0
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool[0].workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc"
  display_name                       = "GitHub OIDC Provider"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }

  attribute_condition = "assertion.repository == '${var.github_repository}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
