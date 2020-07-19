import os
import json
import sys
import logging
from services.training import TrainingService
from controllers.controller import routes, Controller
from di import IFactory
from aiohttp import web
from workers.workers import IWorker

class TrainingController(Controller):
    def __init__(self, training_service: TrainingService, factory: IFactory):
        super().__init__()
        self.training_service=training_service
        self.factory=factory

    @routes.get("/api/training")
    async def list_trainings(self, request):
        trainings_info=self.training_service.list_trainings()
        return self.json(trainings_info)

    @routes.get("/api/training/{package}")
    async def download_training(self, request):
        package = request.match_info['package']
        #package = request.rel_url.query['package']
        return web.FileResponse(f'/deepmicroscopy/{package}/training/trt_graph.pb')

    @routes.put("/api/training/{package}")
    async def upload_package(self, request):
        post = await request.post()
        package_file = post.get('file').file.read()
        package = request.match_info['package']
        with open(f'/deepmicroscopy/{package}.zip','wb') as f:
            f.write(package_file)

        worker=self.factory.create(IWorker,'training_worker')
        msg=json.dumps({'package': package})
        worker.send(msg)

        return self.json({'status':'ok'})


