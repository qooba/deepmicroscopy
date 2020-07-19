#!/bin/bash
cp -r ../../src/server ./server
docker build -t qooba/deepmicroscopy/server:dev -f Dockerfile.dev .
docker build -t qooba/deepmicroscopy/server .
rm -rf ./server
