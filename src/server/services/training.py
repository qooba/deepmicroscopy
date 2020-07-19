import sys
import json
import logging
import zipfile
import tensorflow as tf
import re
import os
import io
import pandas as pd

from PIL import Image
from object_detection.utils import dataset_util
from collections import namedtuple, OrderedDict

import sklearn
from sklearn.model_selection import train_test_split

from google.protobuf import text_format
from object_detection.protos import string_int_label_map_pb2
from object_detection.utils import label_map_util

from object_detection import model_hparams
from object_detection import model_lib

import numpy as np

from google.protobuf import text_format
from object_detection import exporter
from object_detection.protos import pipeline_pb2

slim = tf.contrib.slim
flags = tf.app.flags

import tensorflow.contrib.tensorrt as trt

from tensorflow.python.platform import gfile


class TrainingService:
    def __init__(self): ...


    def list_trainings(self):
        trainings_info=[]
        for package in os.listdir('/deepmicroscopy'):
            if not os.path.isfile(f'/deepmicroscopy/{package}'):
                trainings_info.append({
                    'name': package,
                    'finished': os.path.isfile(f'/deepmicroscopy/{package}/training/trt_graph.pb')
                })

        return trainings_info

    def start_training(self, package: str ='1111111', num_steps: int = 1000, selected_model: str = 'ssd_mobilenet_v2', batch_size: int = 8):
        os.makedirs(f'/deepmicroscopy/{package}', exist_ok=True)
        with zipfile.ZipFile(f'/deepmicroscopy/{package}.zip', 'r') as zip_ref:
            zip_ref.extractall(f'/deepmicroscopy/{package}')

        v = Via(f'/deepmicroscopy/{package}/data/project.json')
        v.prepare()

        test_record_fname = f'/deepmicroscopy/{package}/data/test.record'
        train_record_fname = f'/deepmicroscopy/{package}/data/train.record'
        label_map_pbtxt_fname = f'/deepmicroscopy/{package}/data/label_map.pbtxt'

        num_eval_steps = 50

        MODELS_CONFIG = {
            'ssd_mobilenet_v2': {
                'model_name': 'ssd_mobilenet_v2_coco_2018_03_29',
                'pipeline_file': 'ssd_mobilenet_v2_coco.config',
                'batch_size': 8
            },
            'faster_rcnn_inception_v2': {
                'model_name': 'faster_rcnn_inception_v2_coco_2018_01_28',
                'pipeline_file': 'faster_rcnn_inception_v2_pets.config',
                'batch_size': 12
            },
            'rfcn_resnet101': {
                'model_name': 'rfcn_resnet101_coco_2018_01_28',
                'pipeline_file': 'rfcn_resnet101_pets.config',
                'batch_size': 8
            },
            'ssd_mobilenet_v1_coco': {
                'model_name': 'ssd_mobilenet_v1_coco_2018_01_28',
                'pipeline_file': 'ssd_mobilenet_v1_coco.config',
                'batch_size': 12
            },
        }

        # Name of the object detection model to use.
        MODEL = MODELS_CONFIG[selected_model]['model_name']

        # Name of the pipline file in tensorflow object detection API.
        pipeline_file = MODELS_CONFIG[selected_model]['pipeline_file']

        # Training batch size fits in Colabe's Tesla K80 GPU memory for selected model.
        batch_size = MODELS_CONFIG[selected_model]['batch_size']

        DEST_DIR = '/server/pretrained_model'

        fine_tune_checkpoint = os.path.join(DEST_DIR, "model.ckpt")

        pipeline_fname = os.path.join('/server/object_detection/samples/configs/', pipeline_file)

        pipeline_fname_new = os.path.join(f'/deepmicroscopy/{package}', pipeline_file)

        num_classes = self.get_num_classes(label_map_pbtxt_fname)
        with open(pipeline_fname) as f:
            s = f.read()
        with open(pipeline_fname_new, 'w') as f:

            # fine_tune_checkpoint
            s = re.sub('fine_tune_checkpoint: ".*?"',
                       'fine_tune_checkpoint: "{}"'.format(fine_tune_checkpoint), s)

            # tfrecord files train and test.
            s = re.sub(
                '(input_path: ".*?)(train.record)(.*?")', 'input_path: "{}"'.format(train_record_fname), s)
            s = re.sub(
                '(input_path: ".*?)(test.record)(.*?")', 'input_path: "{}"'.format(test_record_fname), s)

            # label_map_path
            s = re.sub(
                'label_map_path: ".*?"', 'label_map_path: "{}"'.format(label_map_pbtxt_fname), s)

            # Set training batch_size.
            s = re.sub('batch_size: [0-9]+',
                       'batch_size: {}'.format(batch_size), s)

            # Set training steps, num_steps
            s = re.sub('num_steps: [0-9]+',
                       'num_steps: {}'.format(num_steps), s)

            # Set number of classes num_classes.
            s = re.sub('num_classes: [0-9]+',
                       'num_classes: {}'.format(num_classes), s)
            f.write(s)

        model_dir = f'/deepmicroscopy/{package}/training/'
        os.makedirs(model_dir, exist_ok=True)

        config = tf.estimator.RunConfig(model_dir=model_dir)
        train_and_eval_dict = model_lib.create_estimator_and_inputs(
            run_config=config,
            hparams=model_hparams.create_hparams(None),
            pipeline_config_path=pipeline_fname_new,
            train_steps=num_steps,
            sample_1_of_n_eval_examples=1,
            sample_1_of_n_eval_on_train_examples=(5))
        estimator = train_and_eval_dict['estimator']
        train_input_fn = train_and_eval_dict['train_input_fn']
        eval_input_fns = train_and_eval_dict['eval_input_fns']
        eval_on_train_input_fn = train_and_eval_dict['eval_on_train_input_fn']
        predict_input_fn = train_and_eval_dict['predict_input_fn']
        train_steps = train_and_eval_dict['train_steps']

        train_spec, eval_specs = model_lib.create_train_and_eval_specs(
            train_input_fn,
            eval_input_fns,
            eval_on_train_input_fn,
            predict_input_fn,
            train_steps,
            eval_on_train_data=False)

        result=tf.estimator.train_and_evaluate(estimator, train_spec, eval_specs[0])

        logging.info(result)

        output_directory = f'/deepmicroscopy/{package}/training'

        lst = os.listdir(model_dir)
        lst = [l for l in lst if 'model.ckpt-' in l and '.meta' in l]
        steps=np.array([int(re.findall('\d+', l)[0]) for l in lst])
        last_model = lst[steps.argmax()].replace('.meta', '')

        last_model_path = os.path.join(model_dir, last_model)

        pipeline_config = pipeline_pb2.TrainEvalPipelineConfig()
        with tf.gfile.GFile(pipeline_fname_new, 'r') as f:
          text_format.Merge(f.read(), pipeline_config)
        text_format.Merge('', pipeline_config)

        input_shape = None
        input_type='image_tensor'
        exporter.export_inference_graph(
            input_type, pipeline_config, last_model_path,
            output_directory, input_shape=input_shape,
            write_inference_graph=False)

        pb_fname = os.path.join(os.path.abspath(output_directory), "frozen_inference_graph.pb")

        GRAPH_PB_PATH = f'/deepmicroscopy/{package}/training/frozen_inference_graph.pb'

        with tf.Session() as sess:
            print("load graph")
            with gfile.FastGFile(GRAPH_PB_PATH,'rb') as f:
                graph_def = tf.GraphDef()
            graph_def.ParseFromString(f.read())
            sess.graph.as_default()
            tf.import_graph_def(graph_def, name='')
            graph_nodes=[n for n in graph_def.node]
            names = []
            for t in graph_nodes:
               names.append(t.name)
            print(names)

        input_names = ['image_tensor']
        output_names = ['detection_boxes','detection_scores','detection_multiclass_scores','detection_classes','num_detections','raw_detection_boxes','raw_detection_scores']

        trt_graph = trt.create_inference_graph(
            input_graph_def=graph_def,
            outputs=output_names,
            max_batch_size=1,
            max_workspace_size_bytes=1 << 25,
            precision_mode='FP16',
            minimum_segment_size=50
        )

        with open(f'/deepmicroscopy/{package}/training/trt_graph.pb', 'wb') as f:
            f.write(trt_graph.SerializeToString())

        return {'status':'done', 'train_spec':train_spec, 'eval_specs':eval_specs }

    def get_num_classes(self, pbtxt_fname):
        from object_detection.utils import label_map_util
        label_map = label_map_util.load_labelmap(pbtxt_fname)
        categories = label_map_util.convert_label_map_to_categories(
            label_map, max_num_classes=90, use_display_name=True)
        category_index = label_map_util.create_category_index(categories)
        return len(category_index.keys())


class Via:

  def __init__(self,via_project):
    with open(via_project,'r') as f:
      self.via=json.loads(f.read())
      self.metadata=self.via['_via_img_metadata']
      self.path = os.path.dirname(via_project)

  def prepare(self):
    class_names = self._prepare_class_names()
    data_train, data_test = train_test_split(list(self.metadata.values()), test_size=0.3)
    label_map = self._prepare_label_map(class_names)
    self._prepare_tfdata(label_map,data_train,f'{self.path}/train.record')
    self._prepare_tfdata(label_map,data_test,f'{self.path}/test.record')

  def _prepare_tfdata(self, label_map, input_data, output_path):
      data=[]

      for v in input_data:
        for region in v['regions']:
          region_attributes=region['region_attributes']
          class_attribute=region_attributes['class']
          shape_attributes=region['shape_attributes']
          xmin = int(shape_attributes['x'])
          ymin = int(shape_attributes['y'])
          xmax = xmin+int(shape_attributes['width'])
          ymax = ymin+int(shape_attributes['height'])
          data.append([v['filename'],'1600','1200',class_attribute,xmin,ymin,xmax,ymax])

      df = pd.DataFrame(data,columns=['filename', 'width','height','class','xmin','ymin','xmax','ymax'])

      with tf.python_io.TFRecordWriter(output_path) as writer:
        grouped = self.__split(df, "filename")
        for group in grouped:
          tf_example = self.__create_tf_example(group, self.path, label_map)
          writer.write(tf_example.SerializeToString())
        writer.close()

  def _prepare_class_names(self):
    classes_names=[]

    for k,v in self.metadata.items():
      for region in v['regions']:
        region_attributes=region['region_attributes']
        class_attribute=region_attributes['class']
        classes_names.append(class_attribute)

    return list(set(classes_names))

  def _prepare_label_map(self, classes_names):
    pbtxt_content = ""
    label_map = {}
    for i, class_name in enumerate(classes_names):
      pbtxt_content = (pbtxt_content+"item {{\n    id: {0}\n    name: '{1}'\n}}\n\n".format(i + 1, class_name))
      label_map[class_name] = i + 1

    pbtxt_content = pbtxt_content.strip()

    with open(f'{self.path}/label_map.pbtxt','w') as f:
      f.write(pbtxt_content)

    return label_map

  def __split(self, df, group):
      data = namedtuple("data", ["filename", "object"])
      gb = df.groupby(group)
      return [
          data(filename, gb.get_group(x))
          for filename, x in zip(gb.groups.keys(), gb.groups)
      ]

  def __create_tf_example(self, group, path, label_map):
      with tf.gfile.GFile(os.path.join(path, "{}".format(group.filename)), "rb") as fid:
          encoded_jpg = fid.read()
      encoded_jpg_io = io.BytesIO(encoded_jpg)
      image = Image.open(encoded_jpg_io)
      width, height = image.size

      filename = group.filename.encode("utf8")
      image_format = b"jpg"
      # check if the image format is matching with your images.
      xmins = []
      xmaxs = []
      ymins = []
      ymaxs = []
      classes_text = []
      classes = []

      for index, row in group.object.iterrows():
          xmins.append(row["xmin"] / width)
          xmaxs.append(row["xmax"] / width)
          ymins.append(row["ymin"] / height)
          ymaxs.append(row["ymax"] / height)
          classes_text.append(row["class"].encode("utf8"))
          class_index = label_map.get(row["class"])
          assert (
              class_index is not None
          ), "class label: `{}` not found in label_map: {}".format(
              row["class"], label_map
          )
          classes.append(class_index)

      tf_example = tf.train.Example(
          features=tf.train.Features(
              feature={
                  "image/height": dataset_util.int64_feature(height),
                  "image/width": dataset_util.int64_feature(width),
                  "image/filename": dataset_util.bytes_feature(filename),
                  "image/source_id": dataset_util.bytes_feature(filename),
                  "image/encoded": dataset_util.bytes_feature(encoded_jpg),
                  "image/format": dataset_util.bytes_feature(image_format),
                  "image/object/bbox/xmin": dataset_util.float_list_feature(xmins),
                  "image/object/bbox/xmax": dataset_util.float_list_feature(xmaxs),
                  "image/object/bbox/ymin": dataset_util.float_list_feature(ymins),
                  "image/object/bbox/ymax": dataset_util.float_list_feature(ymaxs),
                  "image/object/class/text": dataset_util.bytes_list_feature(
                      classes_text
                  ),
                  "image/object/class/label": dataset_util.int64_list_feature(classes),
              }
          )
      )

      return tf_example

