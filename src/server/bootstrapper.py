import di
from typing import Callable
from functools import lru_cache
from services.training import TrainingService
from controllers.controller import IController
from controllers.training_controller import TrainingController
from workers.workers import IWorker, TrainingWorker
from services.ws import WebSocketManager

class Bootstapper:

    def bootstrap(self):
        c = Bootstapper.container()
        c.register_instance(di.IContainer, c)
        c.register_instance(di.IFactory, di.Factory(c))

        # services
        c.register_singleton(TrainingService)
        c.register_singleton(WebSocketManager)

        # controllers
        c.register(IController, TrainingController, "training")

        # workers
        c.register_singleton(IWorker, TrainingWorker, 'training_worker')

        return c



    @staticmethod
    @lru_cache()
    def container():
        return di.Container()
