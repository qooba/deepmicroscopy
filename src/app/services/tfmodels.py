class ITFModel:
    def predict(self, input_data):
        raise NotImplementedError("predict")

class TFModel(ITFModel):
    def __init__(self, graph_def_pb_file):

        # from __future__ import division
        # from __future__ import print_function
        # from __future__ import absolute_import

        import tensorflow as tf
        import tensorflow.contrib.tensorrt as trt

        #with tf.io.gfile.GFile(graph_def_pb_file, "rb") as f:
        graph_def = tf.compat.v1.GraphDef()
        graph_def.ParseFromString(graph_def_pb_file.read())

        with tf.Graph().as_default() as graph:
            tf.import_graph_def(graph_def, name="")

            tf_config = tf.ConfigProto()
            tf_config.gpu_options.allow_growth = True
            self.sess = tf.Session(config=tf_config)

    def __enter__(self):
        return self

    def __exit__(self, type, value, traceback):
        self.sess.close()

class SSD_TFModel(TFModel):
    def __init__(self, graph_file):
        super().__init__(graph_file)
        self._tf_input = self.sess.graph.get_tensor_by_name('image_tensor:0')
        self._tf_scores = self.sess.graph.get_tensor_by_name('detection_scores:0')
        self._tf_boxes = self.sess.graph.get_tensor_by_name('detection_boxes:0')
        self._tf_classes = self.sess.graph.get_tensor_by_name('detection_classes:0')
        self._tf_num_detections = self.sess.graph.get_tensor_by_name('num_detections:0')

    def predict(self,input_data):
        scores, boxes, classes, num_detections = self.sess.run(
            [self._tf_scores, self._tf_boxes, self._tf_classes, self._tf_num_detections],
            feed_dict={self._tf_input: input_data[None, ...]})
        boxes = boxes[0]
        scores = scores[0]
        classes = classes[0]
        num_detections = int(num_detections[0])
        return boxes, scores, classes, num_detections

    def __exit__(self, type, value, traceback):
        del self._tf_input
        del self._tf_scores
        del self._tf_boxes
        del self._tf_classes
        del self._tf_num_detections
        super().__exit__(type, value, traceback)

