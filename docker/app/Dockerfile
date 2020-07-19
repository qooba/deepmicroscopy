FROM nvcr.io/nvidia/l4t-base:r32.2.1
WORKDIR /
ENV TZ=Europe/Warsaw LC_ALL=C.UTF-8 LANG=C.UTF-8 DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y --fix-missing make g++
RUN apt update && apt install -y --fix-missing python3-pip libhdf5-serial-dev hdf5-tools
RUN apt update && apt install -y python3-h5py
RUN apt -yq install libffi-dev libssl-dev libsrtp2-dev
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && apt update && apt -yq install python3-pil python3-opencv libavdevice-dev libavfilter-dev libopus-dev libvpx-dev pkg-config python3-cffi
RUN pip3 install -U numpy==1.17.3
RUN pip3 install --pre --no-cache-dir --extra-index-url https://developer.download.nvidia.com/compute/redist/jp/v42 tensorflow-gpu==1.15.0
RUN pip3 install av==6.2.0
RUN pip3 install aiohttp==3.6.2 aiortc==0.9.22 minio==5.0.7 jinja2==2.11.1 cachetools==4.0.0 pyyaml==5.3 pyzmq==18.1.1 watchdog[watchmedo] aiohttp_cors==0.7.0 ujson==1.35 jupyterlab
COPY ./app /app
WORKDIR /app/
CMD python3 microscope.py
