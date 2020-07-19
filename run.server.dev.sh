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

docker run -d --rm --network app_default --name nginx -p 80:80 -p 443:443 \
	-v $(pwd)/src/servernginx/conf:/etc/nginx/conf.d \
	-v $(pwd)/src/serverfront:/www/data \
	-v $(pwd)/ssl:/ssl \
	nginx


