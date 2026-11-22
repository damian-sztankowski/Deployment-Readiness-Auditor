output "service_uri" {
  description = "Deployed Cloud Run v2 HTTPS URL for DRA"
  value       = google_cloud_run_v2_service.dra.uri
}

output "runtime_service_account_email" {
  description = "Dedicated least-privilege service account attached to DRA"
  value       = google_service_account.dra_runtime.email
}

output "audit_api_endpoint" {
  description = "Audit API URL for dra-cli --endpoint"
  value       = "${google_cloud_run_v2_service.dra.uri}/api/audit"
}
