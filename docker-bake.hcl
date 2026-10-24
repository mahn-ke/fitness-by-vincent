group "default" {
  targets = ["nginx", "redis", "powersync"]
}

target "_common" {
  platforms = ["linux/amd64"]
  labels = {
    "org.opencontainers.image.source" = "https://github.com/mahn-ke/fitness-by-vincent"
  }
}

target "nginx" {
  inherits = ["_common"]
  context = "config"
  target = "nginx"
  tags = ["ghcr.io/mahn-ke/fitness-by-vincent/nginx:latest"]
}

target "redis" {
  inherits = ["_common"]
  context = "config"
  target = "redis"
  tags = ["ghcr.io/mahn-ke/fitness-by-vincent/redis:latest"]
}

target "powersync" {
  inherits = ["_common"]
  context = "config-powersync"
  tags = ["ghcr.io/mahn-ke/fitness-by-vincent/powersync:latest"]
}
