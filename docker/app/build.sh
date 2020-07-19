#!/bin/bash
cp -r ../../src/app ./app
docker build -t qooba/deepmicroscopy/app:dev -f Dockerfile.dev .
docker build -t qooba/deepmicroscopy/app .
rm -rf ./app
