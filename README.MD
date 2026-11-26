# fitness.by.vincent.mahn.ke

Hosts the container serving [fitness.by.vincent.mahn.ke](https://fitness.by.vincent.mahn.ke).

## Container configuration

The shared deployment workflow builds `docker-bake.hcl` and publishes NGINX,
Redis, PowerSync, and Node app images under `ghcr.io/mahn-ke/fitness-by-vincent/`.
These images contain `config/nginx.conf`, `config/redis.conf`, and the
`config-powersync` YAML files respectively, rather than mounting the runner
checkout at runtime. The build context excludes `config/prod.env`.
Secrets remain runtime environment variables and data remains in named volumes.
Compose still reads `config/prod.env` when creating containers, but existing
containers do not need that file to restart.

Deploy once to recreate the affected containers without the old mounts.
For local builds, run `docker buildx bake --file docker-bake.hcl --load`.

## OAuth2/OIDC provider

wger acts as an OAuth2/OIDC provider for other services (for example reports.by.vincent.mahn.ke
reading workouts with scope `api:read`). Terraform in `mahn-ke/repos` (`infrastructure/modules/wger_oauth`)
generates the provider's signing key (`IDP_OIDC_PRIVATE_KEY`) and the client definitions
(`WGER_OIDC_CLIENTS`, JSON), and stores both as Actions secrets in this repository. The one-shot
`oidc_setup` service creates or updates each client on every deploy. If `IDP_OIDC_PRIVATE_KEY` is unset,
wger keeps the provider off and `/identity/o/authorize` returns 404.
