import jinja2
import sys
import json
import logging
from functools import lru_cache
from services.storage import Storage
import urllib.parse as urlparse
from urllib.parse import parse_qs
from datetime import datetime, timedelta

class ProjectManager:

    def __init__(self, storage: Storage):
        self.storage=storage

    def list_projects(self):
        return self.storage.list_buckets()

    def project_details(self, project_name):
        images=[f.object_name for f in self.storage.list_objects(project_name)
               if '.jpg' in f.object_name]
        try:
            data = self.storage.get_object(project_name, 'project.json')
            data = json.loads(data.data.decode('utf-8'))
            project_img=data['_via_img_metadata']
            project_img_keys=list(project_img)

            images_to_add=[img for img in images if not
                           any([img in p_img for p_img in project_img_keys])]
            for img in images_to_add:
                file_url = self.__prepare_file_url(project_name, img)
                project_img[file_url]={"filename":file_url, "size":-1,
                                       "regions":[], "file_attributes":{}}

            images_to_del=[p_img for p_img in project_img_keys if not
                           any([img in p_img for img in images])]
            for img in images_to_del:
                del project_img[img]

            d=data['_via_img_metadata']
            dk=d.keys()
            images_url_expired=[]
            for img in images:
                for key in dk:
                    if img in key:
                        parsed = urlparse.urlparse(key)
                        date=parse_qs(parsed.query)['X-Amz-Date']
                        expires=parse_qs(parsed.query)['X-Amz-Expires']
                        date=datetime.strptime(date[0], '%Y%m%dT%H%M%SZ')

                        if (date+timedelta(seconds=int(expires[0])))<datetime.utcnow():
                            logging.info(f'date: {date}, expires: {expires}, date_diff: {date_diff}')
                            file_url = self.__prepare_file_url(project_name, img)
                            d[file_url]=d[key]
                            d[file_url]['filename']=file_url
                            images_url_expired.append(key)
                            del d[key]

            project_data=json.dumps(data)
            if len(images_to_add) > 0 or len(images_to_del) > 0 or len(images_url_expired) > 0:
                self.storage.put_string_as_object(
                    project_name, 'project.json', project_data, 'application/json')

            return project_data
        except Exception as e:
            print(e,sys.stderr)
            project_files = []
            for img in images:
                file_url = self.__prepare_file_url(project_name, img)
                project_files.append({"name": img,"url": file_url})

            project = {"name": project_name,"files": project_files}
            project_data = self.__initialize_project(project)
            self.storage.put_string_as_object(
                project_name, 'project.json', project_data, 'application/json')
            return project_data

    def create_project(self, project_name):
        return self.storage.create_bucket(project_name)

    def list_models(self, project_name):
        models=[f.object_name for f in self.storage.list_objects(project_name)
               if 'models/' in f.object_name]

        return models

    def save_project(self, project_name, project):
        return self.storage.put_string_as_object(project_name, "project.json", json.dumps(project), "application/json")

    def upload_model(self, project_name, model_type, model_name):
        return self.storage.presigned_put_object(project_name, f"models/{model_type}/{model_name}").replace('http://minio:9000/', '/file/')

    def __initialize_project(self, project):
        return ProjectManager.__prepare_template().render(project=project)

    def __prepare_file_url(self, project_name, file):
        file_url = self.storage.presigned_get_object(project_name, file)
        return file_url.replace('http://minio:9000/', '/file/')

    @staticmethod
    @lru_cache()
    def __prepare_environment():
        return jinja2.Environment(loader=jinja2.FileSystemLoader("/app"))

    @staticmethod
    @lru_cache()
    def __prepare_template():
        return ProjectManager.__prepare_environment().get_template('project.json.j2')
