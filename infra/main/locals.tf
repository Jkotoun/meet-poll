locals {
  services = {
    backend  = { health_path = "/health" }
    frontend = { health_path = "/" }
  }
}
