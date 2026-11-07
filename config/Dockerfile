FROM nginx:stable AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM redis:latest@sha256:1f88291b4c57bdf249f02eb085a8669889b2d2954e91d4de5118a5da6b78dd53 AS redis
COPY redis.conf /usr/local/etc/redis/redis.conf