#!/bin/bash

#docker network create -d bridge app_default

docker run --gpus all --network app_default -d --rm \
  -v $(pwd)/training_output:/deepmicroscopy \
  --name server qooba/deepmicroscopy:server

docker run --gpus all --network app_default -d --rm \
  -v $(pwd)/training_output:/deepmicroscopy \
  --name tensorboard \
  qooba/deepmicroscopy:server tensorboard --logdir /deepmicroscopy --path_prefix /tensorboard

docker run -d --rm --network app_default --name nginx -p 80:80 -p 443:443 qooba/deepmicroscopy/serverfront
