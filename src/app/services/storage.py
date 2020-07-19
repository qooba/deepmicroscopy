import os
import datetime
from io import BytesIO, open
from minio import Minio, PostPolicy
from minio.error import ResponseError

class Storage:

    def __init__(self):
        print(os.getenv('minio_access_key'))
        print(os.getenv('minio_secret_key'))
        self.minioClient = Minio('minio:9000',
                                 access_key=os.getenv('minio_access_key'),
                                 secret_key=os.getenv('minio_secret_key'),
                                 secure=False)

    def list_buckets(self):
        return self.minioClient.list_buckets()

    def list_objects(self, bucket_name):
        return self.minioClient.list_objects(bucket_name, recursive=True)

    def create_bucket(self, bucket_name):
        self.minioClient.make_bucket(bucket_name)

    def get_object(self, bucket_name, object_name):
        return self.minioClient.get_object(bucket_name, object_name)

    def put_string_as_object(self, bucket_name, object_name, object_data, content_type):
        bytes_data = object_data.encode('utf-8')
        stream_data = BytesIO(bytes_data)
        return self.minioClient.put_object(bucket_name, object_name, stream_data, len(bytes_data), content_type)

    def presigned_get_object(self, bucket_name, object_name):
        return self.minioClient.presigned_get_object(bucket_name, object_name, datetime.timedelta(seconds=604800))

    def presigned_put_object(self, bucket_name, object_name):
        return self.minioClient.presigned_put_object(bucket_name, object_name, datetime.timedelta(days=1))


    def put_object(self, bucket_name, object_name, object_data, content_type=None):
        object_data_len=object_data.getbuffer().nbytes
        self.minioClient.put_object(bucket_name, object_name, object_data,
                    object_data_len, content_type=content_type)

    def post_object(self, bucket_name, object_name=None, content_type=None):
        post_policy = PostPolicy()
        post_policy.set_bucket_name(bucket_name)

        if object_name:
            post_policy.set_key(object_name)

        if content_type:
            post_policy.set_content_type(content_type)

        post_policy.set_content_length_range(0, 1024000)
        expires_date = datetime.utcnow()+timedelta(days=10)
        post_policy.set_expires(expires_date)
        return self.minioClient.presigned_post_policy(post_policy)
