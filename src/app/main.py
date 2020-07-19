from fastapi import Depends, FastAPI, HTTPException, BackgroundTasks
from starlette.responses import Response
from starlette.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from starlette.status import HTTP_401_UNAUTHORIZED
from io import BytesIO, open
import os
import json
from storage import Storage
from project import ProjectManager
from models import Project

storage = Storage()
project_manager = ProjectManager()

app = FastAPI()

# project
@app.get("/api/projects")
def list_projects():
    return storage.list_buckets()


@app.get("/api/projects/{bucket_name}")
def project_details(bucket_name):
    try:
        data = storage.get_object(bucket_name, 'project.json')
        return json.loads(data)
    except:
        files = []
        for file in storage.list_objects(bucket_name):
            print(file)
            file_url = storage.presigned_get_object(
                bucket_name, file.object_name)
            file_url = file_url.replace('http://minio:9000/', '/file/')

            files.append({
                "name": file.object_name,
                "url": file_url
            })

        project = {
            "name": bucket_name,
            "files": files
        }

        project_data = project_manager.initialize_project(project)
        storage.put_string_as_object(
            bucket_name, 'project.json', project_data, 'application/json')
        return json.loads(project_data)


@app.post("/api/projects")
def create_project(project: Project):
    return storage.create_bucket(project.name)


@app.get("/api/projects/{bucket_name}/files/{file_name}")
def post_object(bucket_name, file_name, content_type: str = None):
    return storage.post_object(bucket_name, file_name, content_type)


@app.get("/api/projects/{bucket_name}/files")
def project_files(bucket_name):
    file_urls = []
    for file in storage.list_objects(bucket_name):
        file_url = storage.presigned_get_object(bucket_name, file.object_name)
        file_url = file_url.replace('http://minio:9000/', '/file/')
        file_urls.append(file_url)
    return file_urls
