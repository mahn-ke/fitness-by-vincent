FROM nginx:stable AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM redis:latest@sha256:0a014ae5c04f55c82aaad2314de411c7a203de1c4312c3e526939226a0185dd9 AS redis
COPY redis.conf /usr/local/etc/redis/redis.conf