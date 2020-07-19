#!/bin/bash

cp -r ../../src/serverfront front
cp -r ../../src/servernginx/conf conf

mkdir ssl
mkdir ssl/private
mkdir ssl/certs
openssl req -x509 -nodes -days 365 -subj "/C=CA/ST=QC/O=Company, Inc./CN=*.qba" -newkey rsa:2048 -keyout ./ssl/private/nginx-selfsigned.key -out ./ssl/certs/nginx-selfsigned.crt

docker build -t qooba/deepmicroscopy:serverfront .

rm -rf front conf ssl
