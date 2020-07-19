#!/bin/bash

#docker network create -d bridge app_default

mkdir -p data

docker run -d --rm -p 9000:9000 --network app_default --name minio \
  -e "MINIO_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE" \
  -e "MINIO_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
  -v $(pwd)/data:/data \
  qooba/deepmicroscopy:minio server /data


docker run --runtime nvidia --network app_default -d --rm \
  --device=/dev/video0:/dev/video0 -p 8080:8080 -p 8888:8888 \
  -e DISPLAY=$DISPLAY \
  -e minio_access_key='AKIAIOSFODNN7EXAMPLE' \
  -e minio_secret_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' \
  -v /tmp/.X11-unix/:/tmp/.X11-unix \
  --name app_rtc \
  qooba/deepmicroscopy:app

docker run -d --rm --network app_default --name nginx -p 80:80 -p 443:443 qooba/deepmicroscopy/front
