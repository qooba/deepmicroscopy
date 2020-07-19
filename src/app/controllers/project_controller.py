import json
import sys
from services.project import ProjectManager
from controllers.controller import routes, Controller
from di import IFactory
from workers.workers import IWorker
from services.ws import WebSocketManager

class ProjectController(Controller):
    def __init__(self, project_manager: ProjectManager, factory: IFactory):
        super().__init__()
        self.project_manager=project_manager
        self.factory=factory

    @routes.get("/api/projects")
    async def list_projects(self, request):
        projects=self.project_manager.list_projects()
        return self.json(projects)

    @routes.get("/api/projects/{project_name}")
    async def project_details(self, request):
        project_name = request.match_info['project_name']
        project_details=self.project_manager.project_details(project_name)
        return self.json(project_details)

    @routes.get("/api/projects/{project_name}/models")
    async def list_models(self, request):
        project_name = request.match_info['project_name']
        models_list=self.project_manager.list_models(project_name)
        return self.json(models_list)

    @routes.post("/api/projects")
    async def create_project(self, request):
        project = await request.json()
        print(project,sys.stderr)
        result = self.project_manager.create_project(project['name'])
        return self.json(result)

    @routes.post("/api/projects/{project_name}")
    async def save_project(self, request):
        project=await request.json()
        project_name = request.match_info['project_name']
        result = self.project_manager.save_project(project_name,project)
        return self.json(result)

    @routes.get("/api/projects/{project_name}/models/{model_type}/{model_name}")
    async def model_upload(self, request):
        project_name = request.match_info['project_name']
        model_type = request.match_info['model_type']
        model_name = request.match_info['model_name']
        upload_data=self.project_manager.upload_model(project_name,model_type,model_name)
        return self.json(upload_data)

    @routes.post("/api/projects/{project_name}/model")
    async def model_run(self, request):
        project_name = request.match_info['project_name']
        message=await request.json()
        message['project_name']=project_name
        worker=None
        if 'tensorflow' in message['model']:
            worker=self.factory.create(IWorker,'tfmodel_worker')

        message=json.dumps(message)
        worker.send(message)
        return self.json({})

