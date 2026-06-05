# 1. Project Identifiers & Labels
provider "google" {
  project = "finance-prod-12345" # Targets: project, project_id
  region  = "us-central1"
}

# 2. Identities (PII)
resource "google_compute_instance" "vm_instance" {
  name         = "admin-box"
  machine_type = "e2-medium"

  metadata = {
    # 3. Authentication Data & 4. Emails
    owner-email = "manager@company-internal.com" # Targets: email regex
    api-key     = "AIzaSyB-4X9-2kLp0-SecretKey99" # Targets: api_key, secret, token
  }

  # 5. Network Topography
  network_interface {
    network    = "prod-secure-vpc" # Targets: network, vpc
    subnetwork = "hr-private-subnet" # Targets: subnetwork

    access_config {
      # 6. IP Addresses (Non-well-known)
      nat_ip = "35.192.10.55" # Targets: ipRegex (should be redacted)
    }
  }
}

resource "google_compute_firewall" "allow_all" {
  name    = "dangerous-rule"
  network = "prod-secure-vpc"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  # Auditor Logic Test: 0.0.0.0/0 should NOT be redacted 
  # so the DRA can still flag the security risk.
  source_ranges = ["0.0.0.0/0"]
}
}
