import ssl
import logging
import os
import threading
import aiohttp_cors
from aiohttp import web
from workers.workers import IWorker
from controllers.controller import routes, IController
from controllers.project_controller import ProjectController
from controllers.video_controller import VideoController
from bootstrapper import Bootstapper
from services.ws import WebSocketManager

ROOT = os.path.dirname(__file__)
container=Bootstapper().bootstrap()

#sslcontext = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
#sslcontext.load_cert_chain('ssl/certs/app-selfsigned.crt', 'ssl/private/app-selfsigned.key')

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app = web.Application()
    cors = aiohttp_cors.setup(app)

    workers = container.resolve_all(IWorker)
    for worker in workers:
        threading.Thread(target=worker.work).start()

    controllers = container.resolve_all(IController)
    for controller in controllers:
        routes.add_class_routes(controller)
        if type(controller) is VideoController:
            offer_route=app.router.add_post("/offer", controller.offer)
            cors.add(offer_route, {
                "*": aiohttp_cors.ResourceOptions(
                    allow_credentials=True,
                    expose_headers=("X-Custom-Server-Header",),
                    allow_headers=("X-Requested-With", "Content-Type"),
                    max_age=3600,
                )
            })
            app.on_shutdown.append(controller.on_shutdown)

    app.add_routes([web.get('/ws', WebSocketManager.websocket_handler)])
    app.add_routes(routes)
    #web.run_app(app, port=8080, ssl_context=sslcontext)
    web.run_app(app, port=8080)
