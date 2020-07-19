import logging
import os
import threading
import aiohttp_cors
from aiohttp import web
from controllers.controller import routes, IController
from bootstrapper import Bootstapper
from services.ws import WebSocketManager
from workers.workers import IWorker

ROOT = os.path.dirname(__file__)
container=Bootstapper().bootstrap()


if __name__ == "__main__":
    os.makedirs(f'/deepmicroscopy', exist_ok=True)
    logging.basicConfig(level=logging.INFO)
    app = web.Application()
    cors = aiohttp_cors.setup(app)

    workers = container.resolve_all(IWorker)
    for worker in workers:
        threading.Thread(target=worker.work).start()

    controllers = container.resolve_all(IController)
    for controller in controllers:
        routes.add_class_routes(controller)

    app.add_routes([web.get('/ws', WebSocketManager.websocket_handler)])
    app.add_routes(routes)
    web.run_app(app, port=8080)
