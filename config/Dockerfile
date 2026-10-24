FROM nginx:stable AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

FROM redis:latest@sha256:97ec88159e6d7cfb5ddef9015386087d58a912de80112f06ebdfa78fa5989901 AS redis
COPY redis.conf /usr/local/etc/redis/redis.conf