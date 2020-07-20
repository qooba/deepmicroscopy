#!/bin/bash

#docker network create -d bridge app_default

docker run --gpus all --network app_default -d --rm \
  -v $(pwd)/src/server:/server \
  -v $(pwd)/src/serverfront:/serverfront \
  -v $(pwd)/src/servernginx:/servernginx \
  -v $(pwd)/src/jupyter:/root/.jupyter \
  -v $(pwd)/ssl:/ssl \
  -v $(pwd)/training_output:/deepmicroscopy \
  --name server \
  qooba/deepmicroscopy:server_dev

docker run --gpus all --network app_default -d --rm \
  -v $(pwd)/training_output:/deepmicroscopy \
  --name tensorboard \
  qooba/deepmicroscopy:server_dev tensorboard --logdir /deepmicroscopy --path_prefix /tensorboard

if [ ! -d "ssl" ]; then
mkdir ssl
mkdir ssl/private
mkdir ssl/certs
openssl req -x509 -nodes -days 365 -subj "/C=CA/ST=QC/O=Company, Inc./CN=*.qba" -newkey rsa:2048 -keyout ./ssl/private/nginx-selfsigned.key -out ./ssl/certs/nginx-selfsigned.crt
fi

docker run -d --rm --network app_default --name nginx -p 80:80 -p 443:443 \
	-v $(pwd)/src/servernginx/conf:/etc/nginx/conf.d \
	-v $(pwd)/src/serverfront:/www/data \
	-v $(pwd)/ssl:/ssl \
	nginx


