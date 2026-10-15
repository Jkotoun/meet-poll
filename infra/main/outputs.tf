output "service_urls" {
  value = { for k, s in google_cloud_run_v2_service.app : k => s.uri }
}

output "image_repository" {
  value = google_artifact_registry_repository.images.registry_uri
}
