#!/bin/bash


APP_HOME=$(pwd)


docker run -d --rm --network app_default --name nginx -p 8080:80 \
	-v $APP_HOME/nginx_front/conf:/etc/nginx/conf.d \
	-v $APP_HOME/front:/www/data \
	nginx



