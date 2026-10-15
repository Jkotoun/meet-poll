locals {
  services = {
    backend = {
      health_path         = "/health"
      cloud_sql_instances = [google_sql_database_instance.main.connection_name]
    }
    frontend = {
      health_path         = "/"
      cloud_sql_instances = []
    }
  }
}
