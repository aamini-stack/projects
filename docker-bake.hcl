variable "APP_NAME" {
  // No default — must be provided via --set or env var
}

variable "NODE_VERSION" {
  default = "24"
}

variable "APP_ENV" {
  default = "production"
}

target "docker-metadata-action" {}

target "app" {
  inherits = ["docker-metadata-action"]
  context = "."
  dockerfile = "Dockerfile"
  args = {
    APP_NAME = APP_NAME
    NODE_VERSION = NODE_VERSION
    APP_ENV = APP_ENV
  }
  tags = ["${APP_NAME}:local"]
  cache-from = ["type=gha"]
  cache-to = ["type=gha,mode=max"]
}

target "peace-of-real-estate" {
  inherits = ["app"]
  args = {
    APP_NAME = "peace-of-real-estate"
    NODE_VERSION = NODE_VERSION
    APP_ENV = APP_ENV
  }
}
