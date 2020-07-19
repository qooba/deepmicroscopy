import json
from di import IFactory
from controllers.controller import routes, Controller
from workers.workers import IWorker

class TFModelController(Controller):
    def __init__(self, factory: IFactory):
        super().__init__()
        self.factory=factory

    @routes.get("/api/model/{message}")
    async def project_details(self, request):
        message = request.match_info['message']
        worker=self.factory.create(IWorker,'tfmodel')
        worker.send(message)
        return self.json({})
