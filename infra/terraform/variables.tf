variable "project_id" {
  description = "Google Cloud Project ID hosting Deployment Readiness Auditor"
  type        = string
}

variable "region" {
  description = "Primary Google Cloud region for Cloud Run deployment"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run v2 service name"
  type        = string
  default     = "dra-v3"
}

variable "container_image" {
  description = "Artifact Registry container image digest or tag for DRA v3.0"
  type        = string
}

variable "gemini_api_key_secret_id" {
  description = "Secret Manager secret ID storing the Google Gemini API key"
  type        = string
  default     = "dra-gemini-api-key"
}

variable "session_secret_id" {
  description = "Secret Manager secret ID storing the HMAC session signing key"
  type        = string
  default     = "dra-session-hmac-secret"
}

variable "llm_model" {
  description = "Default Gemini model identifier"
  type        = string
  default     = "gemini-2.5-flash"
}

variable "allow_public_invoker" {
  description = "Whether to allow public browser access to the DRA Web UI (set true for public demos; false enforces IAM/IAP)"
  type        = bool
  default     = false
}

variable "github_repository" {
  description = "Optional GitHub owner/repo (e.g. damian-sztankowski/Deployment-Readiness-Auditor) for Workload Identity Federation"
  type        = string
  default     = ""
}
