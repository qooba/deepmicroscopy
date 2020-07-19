import di
import cv2
from typing import Callable
from functools import lru_cache
from services.image import ImageDraw
from services.storage import Storage
from services.project import ProjectManager
from services.video import VideoTracker, Camera
from services.tfmodels import ITFModel, SSD_TFModel
from services.ws import WebSocketManager
from controllers.controller import IController
from controllers.project_controller import ProjectController
from controllers.video_controller import VideoController
from controllers.tfmodel_controller import TFModelController
from workers.workers import IWorker, TFModelWorker, PredictionsWorker


class Bootstapper:

    def bootstrap(self):
        c = Bootstapper.container()
        c.register_instance(di.IContainer, c)
        c.register_instance(di.IFactory, di.Factory(c))

        # services
        c.register_singleton(Storage)
        c.register_singleton(Camera)
        c.register_singleton(ProjectManager)
        c.register_singleton(VideoTracker)
        c.register_singleton(ImageDraw)
        c.register_singleton(WebSocketManager)

        #c.register_instance(ITFModel,SSD_TFModel("/app/trt_graph.pb"),'ssd')
        c.register_instance(ITFModel, ITFModel())

        # controllers
        c.register(IController, ProjectController, "project")
        c.register(IController, VideoController, "video")
        c.register(IController, TFModelController, "tfmodel")

        # workers
        c.register_singleton(IWorker, TFModelWorker, 'tfmodel_worker')
        c.register_singleton(IWorker, PredictionsWorker, 'predictions_worker')

        #camera = c.resolve(Camera)
        #return_value, image = camera.read()
        #model = c.resolve(ITFModel,'ssd')
        #res=model.predict(image)
        #image_draw=c.resolve(ImageDraw)
        #image=image_draw.process(image,res)

        return c



    @staticmethod
    @lru_cache()
    def container():
        return di.Container()
