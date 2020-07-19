import time
import cv2
import threading
import zmq
import logging
import asyncio
import json
import io
from di import IContainer
from services.tfmodels import ITFModel, SSD_TFModel
from services.ws import WebSocketManager
from services.storage import Storage

class IWorker:
    def work(self) -> None: ...
    def send(self, message: str) -> None: ...

class BaseWorker(IWorker):
    def __init__(self):
        self.sender_context = zmq.Context.instance()
        self.sender = self.sender_context.socket(zmq.PAIR)
        self.sender.connect(self.url)

        self.receiver_context = zmq.Context.instance()
        self.receiver = self.receiver_context.socket(zmq.PAIR)
        self.receiver.bind(self.url)

    async def handle(self, receiver) -> None: ...

    def send(self, message: str):
        self.sender.send(message.encode('utf-8'))

    def work(self) -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.handle(self.receiver))
        loop.close()


    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        self.sender_context.term()
        self.receiver_context.term()
        self._close(manual_close=False)

class PredictionsWorker(BaseWorker):
    def __init__(self, container: IContainer, socket_manager: WebSocketManager, storage: Storage):
        self.url="inproc://predictions_worker"
        super().__init__()
        self.container = container
        self.socket_manager=socket_manager
        self.storage=storage

    async def handle(self, receiver) -> None:
        while True:
            msg  = receiver.recv()
            #logging.info("Prediction: [ %s ]" % (msg))
            #msg=json.loads(msg)
            await self.socket_manager.send(msg.decode())

class TFModelWorker(BaseWorker):
    def __init__(self, container: IContainer, socket_manager: WebSocketManager, storage: Storage):
        self.url="inproc://tfmodel_worker"
        super().__init__()
        self.container = container
        self.socket_manager=socket_manager
        self.storage=storage

    async def handle(self, receiver) -> None:
        while True:
            msg  = receiver.recv()
            logging.info("Loading model: [ %s ]" % (msg))
            msg=json.loads(msg)

            project_name=msg['project_name']
            model=msg['model']
            action=msg['action']
            if action == 'load':
                model_data=self.storage.get_object(msg['project_name'],msg['model'])
                fo = io.BytesIO()
                #with open('/tmp/trt_graph.pb', 'wb') as fo:
                for d in model_data.stream(32*1024):
                    fo.write(d)
                fo.seek(0)
                #model_data=fo.read()

                #logging.info(len(model_data))
                model = SSD_TFModel(fo)
                image = cv2.imread('/app/18.jpg')
                res=model.predict(image)
                self.container.register_instance(ITFModel,model)
                await self.socket_manager.send("Model loaded")
            else:
                model=self.container.resolve(ITFModel)
                del model
                self.container.register_instance(ITFModel, ITFModel())
                await self.socket_manager.send("Model unloaded")

            logging.info("Model loaded: [ %s ]" % (msg))
            time.sleep(1)


