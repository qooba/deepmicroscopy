#!/bin/bash



#APP_HOME='/home/qba/Qooba/deepmicroscopy'

#docker network create -d bridge app_default
#docker build -t qooba/jetson:microscope . -f ./Dockerfile.microscope

mkdir -p data

docker run -d --rm -p 9000:9000 --network app_default --name minio \
  -e "MINIO_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE" \
  -e "MINIO_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" \
  -v $(pwd)/data:/data \
  qooba/deepmicroscopy:minio server /data


#docker run --runtime nvidia --network app_default -d --rm --device=/dev/video0:/dev/video0 -p 80:80 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix/:/tmp/.X11-unix -v $APP_HOME/app:/app --name api -e minio_access_key='AKIAIOSFODNN7EXAMPLE' -e minio_secret_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' qooba/jetson:microscope /start-reload.sh

#docker run --runtime nvidia --network app_default -d --rm -p 80:80 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix/:/tmp/.X11-unix -v $APP_HOME/app:/app --name api -e minio_access_key='AKIAIOSFODNN7EXAMPLE' -e minio_secret_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' qooba/jetson:microscope /start-reload.sh


docker run --runtime nvidia --network app_default -d --rm \
  --device=/dev/video0:/dev/video0 -p 8080:8080 -p 8888:8888 \
  -e DISPLAY=$DISPLAY \
  -e minio_access_key='AKIAIOSFODNN7EXAMPLE' \
  -e minio_secret_key='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' \
  -v /tmp/.X11-unix/:/tmp/.X11-unix \
  -v $(pwd)/src/app:/app \
  -v $(pwd)/src/front:/front \
  -v $(pwd)/src/nginx:/nginx \
  --name app_rtc \
  qooba/deepmicroscopy:app_dev \
  watchmedo auto-restart -d . -p '*.py' --recursive -- python3 microscope.py

#docker run --network app_default -it --rm -v /home/qba/Qooba/deepmicroscopy:/app --name app registry.gitlab.com/qooba/deepmicroscopy vim /app

if [ ! -d "ssl" ]; then
mkdir ssl
mkdir ssl/private
mkdir ssl/certs
openssl req -x509 -nodes -days 365 -subj "/C=CA/ST=QC/O=Company, Inc./CN=*.qba" -newkey rsa:2048 -keyout ./ssl/private/nginx-selfsigned.key -out ./ssl/certs/nginx-selfsigned.crt
fi

docker run -d --rm --network app_default --name nginx -p 80:80 -p 443:443 \
	-v $(pwd)/src/nginx/conf:/etc/nginx/conf.d \
	-v $(pwd)/src/front:/www/data \
	-v $(pwd)/ssl:/ssl \
	nginx

#docker run --runtime nvidia --network app_default --name jupyter -d --rm --device=/dev/video0:/dev/video0 -p 8888:8888 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix/:/tmp/.X11-unix -v /home/qba/Qooba/jetson/jupyter:/opt/notebooks qooba/jetson:jupyter /bin/bash -c "jupyter lab --notebook-dir=/opt/notebooks --ip='0.0.0.0' --port=8888 --no-browser --allow-root --NotebookApp.password='123QWEasd' --NotebookApp.token='123QWEasd'"


#docker run --runtime nvidia --network app_default --name jupyter -d --rm -p 8888:8888 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix/:/tmp/.X11-unix -v /home/qba/Qooba/jetson/jupyter:/opt/notebooks qooba/jetson:jupyter /bin/bash -c "jupyter lab --notebook-dir=/opt/notebooks --ip='0.0.0.0' --port=8888 --no-browser --allow-root --NotebookApp.password='123QWEasd' --NotebookApp.token='123QWEasd'"

#docker run --runtime nvidia --network app_default -it --rm --device=/dev/video0:/dev/video0 -p 5000:5000 -e DISPLAY=$DISPLAY -v /tmp/.X11-unix/:/tmp/.X11-unix --name gstreamer qooba/jetson:microscope gst-launch-1.0 -v v4l2src device=/dev/video0 ! jpegenc ! gdppay ! tcpserversink host=0.0.0.0 port=5000

#docker run --runtime nvidia --network app_default -d --rm -p 8888:8888 \
#  -e DISPLAY=$DISPLAY \
#  -v $APP_HOME/:/code \
#  -v $APP_HOME/jupyter:/root/.jupyter \
#  --name jupyter \
#  qooba/deepmicroscopy \
#  jupyter lab --notebook-dir=/code/ --ip='0.0.0.0' --port=8888 --no-browser --allow-root --NotebookApp.password='' --NotebookApp.token=''

