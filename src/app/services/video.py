import logging
import cv2
import sys
import io
import json
from av import VideoFrame
from aiortc import VideoStreamTrack
from services.tfmodels import ITFModel
from services.image import ImageDraw
from di import IFactory
from workers.workers import IWorker

class Camera:
    def __init__(self):
        self.cam = cv2.VideoCapture(0)
        #self.cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        #self.cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    def read(self):
        return_value, image = self.cam.read()
        self.frame=image
        return return_value, self.frame

    def stop(self):
        self.cam = cv2.VideoCapture(0)

    def capture_image(self):
        return_value, image = self.cam.read()
        (flag, encodedImage) = cv2.imencode(".jpg", image)
        fo = io.BytesIO()
        fo.write(bytearray(encodedImage))
        fo.seek(0)
        return fo
        #return fo.getvalue()


class VideoTracker:
    def __init__(self, camera: Camera, factory: IFactory, image_draw: ImageDraw):
        self.camera=camera
        self.factory=factory
        self.image_draw=image_draw

    def prepare(self):
        return VideoImageTrack(self.camera, self.factory, self.image_draw)


class VideoImageTrack(VideoStreamTrack):
    def __init__(self, camera: Camera, factory: IFactory, image_draw: ImageDraw):
        super().__init__()
        self.camera=camera
        self.factory=factory
        self.image_draw=image_draw
        self.predictions_worker=self.factory.create(IWorker,'predictions_worker')

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        return_value, image = self.camera.read()

        try:
            tfmodel=self.factory.create(ITFModel)
            res=tfmodel.predict(image)
            image,box_results=self.image_draw.process(image,res)
            box_data=json.dumps(box_results)
            self.predictions_worker.send(box_data)
        except NotImplementedError:
            pass
        except Exception as ex:
            logging.info(ex)
            pass

        frame = VideoFrame.from_ndarray(image, format="bgr24")
        frame.pts = pts
        frame.time_base = time_base
        return frame
