FROM nginx:stable AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM redis:latest@sha256:4764ce37931aac77c0d033680b339b19b4a4a81772204d268947cb851212d0ac AS redis
COPY redis.conf /usr/local/etc/redis/redis.conf