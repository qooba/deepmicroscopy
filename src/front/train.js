Vue.component("dropzone",{
  template: `<div class='dropzone'></div>`,
  props: {
    currentProject: null
  },
  data() {
    return {
      uploadDropzone: null
    };
  },
  methods: {
      reload: function(currentProject){
        modelName=Date.now().toString();
        axios
        .get("/api/projects/"+currentProject+"/models/tensorflow/"+modelName+".pb")
        .then(response => {
          console.log(response);
          this.uploadDropzone.options.url=response.data
        });
      }
  },
  mounted(){
    this.uploadDropzone= new Dropzone(this.$el, {
        url:"/", 
        method: "put",
        init: function() {
            this.on("sending", function(file, xhr, formData) {
                var _send = xhr.send;
                xhr.send = function() {
                _send.call(xhr, file);
            }
            });
        }
    });
    //this.reload(this.currentProject);
  }
})

Vue.component('train', {
  data: function () {
    return {
      count: 0,
      message: "hello",
      show: false,
      interval: null,
      imageBytes: null,
      imageBlob: null,
      notinitialized: true,
      snackbarContainer: document.querySelector('#toast'),
      pc: null
    }
  },
  props: {
    currentProject: null
  },
  methods: {
    getBlob: function(url) {
      return axios
        .get(url, {
          responseType: 'arraybuffer'
        })
        .then(response => new Blob([response.data]));
    },

    train: function() {
        axios.get("/api/projects/"+this.$props.currentProject).then(async response => {
            var project=JSON.parse(response.data);
            var imgMetadata=project['_via_img_metadata'];
            var zip = new JSZip();
            var img = zip.folder("data");

            for (var key in imgMetadata) {
                meta = imgMetadata[key];
                filename = meta['filename'];
                filedata = await this.getBlob(filename);
                console.log(filedata);
                filename=filename.split('?')[0].split('/').slice(-1)[0];
                img.file(filename, filedata, {binary: true});
                meta['filename']=filename;
            }

            img.file('project.json', JSON.stringify(project));
            zip.generateAsync({type:"blob"}).then(function(content) {
                saveAs(content, "example.zip");
            });
        });
    }
  },
  updated: function(){
      if(this.$refs.dropzone !== undefined){
        this.$refs.dropzone.reload(this.currentProject);
      }
  },
  template: `
  <main class="mdl-layout__content mdl-color--grey-100" v-if="show">
  <div class="mdl-grid demo-content">
    <div class="demo-card-square mdl-card mdl-cell mdl-cell--12-col">
        <div class="mdl-card__title mdl-card--expand">
            <h2 class="mdl-card__title-text">Train with Tensorflow</h2>
        </div>
    <div class="mdl-card__supporting-text">
        Download the dataset and train using colab notebook.
        Then download the <b>trt_graph.pb</b> and upload below.
    </div>
    <div class="mdl-card__actions mdl-card--border">
        <a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" v-on:click="train">DATA</a>
        <a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" href="https://colab.research.google.com/drive/17XcGqI4dpLhCIifcjmahUmGBTXZQG4ag?usp=sharing" target="blank">COLAB</a>

    <dropzone :current-project="currentProject" ref="dropzone"></dropzone>
    </div>
    </div>
    </div>
</main>
  `
});
