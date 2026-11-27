FROM nginx:stable AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM redis:latest@sha256:56a1737794e36c3ebe8a4544a8ab421af3ab1a6488fb2238aec228c404933fed AS redis
COPY redis.conf /usr/local/etc/redis/redis.conf