FROM nginx:stable AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM redis:latest@sha256:f245f4c83b84a9e9a0588da1c9456e579455310f0945d5db52cd2ba27f2000cc AS redis
COPY redis.conf /usr/local/etc/redis/redis.conf