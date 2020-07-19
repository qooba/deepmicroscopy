import time
import threading
import zmq
import logging
import asyncio
import json
import io
from di import IContainer
from services.ws import WebSocketManager
from services.training import TrainingService

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

class TrainingWorker(BaseWorker):
    def __init__(self, container: IContainer, socket_manager: WebSocketManager, training_service: TrainingService):
        self.url="inproc://training_worker"
        super().__init__()
        self.container = container
        self.socket_manager=socket_manager
        self.training_service=training_service

    async def handle(self, receiver) -> None:
        while True:
            msg  = receiver.recv()
            logging.info("Training: [ %s ]" % (msg))
            msg=json.loads(msg)
            self.training_service.start_training(msg['package'])
            await self.socket_manager.send(msg.decode())

