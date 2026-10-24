# fitness.by.vincent.mahn.ke

Hosts the container serving [fitness.by.vincent.mahn.ke](https://fitness.by.vincent.mahn.ke).

## Container configuration

The shared deployment workflow builds `docker-bake.hcl` and publishes NGINX,
Redis, and PowerSync images under `ghcr.io/mahn-ke/fitness-by-vincent/`.
These images contain `config/nginx.conf`, `config/redis.conf`, and the
`config-powersync` YAML files respectively, rather than mounting the runner
checkout at runtime. The build context excludes `config/prod.env`.
Secrets remain runtime environment variables and data remains in named volumes.
Compose still reads `config/prod.env` when creating containers, but existing
containers do not need that file to restart.

Deploy once to recreate the affected containers without the old mounts.
For local builds, run `docker buildx bake --file docker-bake.hcl --load`.