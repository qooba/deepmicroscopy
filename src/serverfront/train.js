Vue.component("dropzone",{
  template: `<div class='dropzone'></div>`,
  props: {
    currentProject: null,
  },
  data() {
    return {
      uploadDropzone: null,
      modelName: Date.now().toString()
    };
  },
  methods: {
      reload(){
      }
  },
  mounted(){
    this.uploadDropzone= new Dropzone(this.$el, {
        url:"/api/training/"+this.modelName, 
        paramName: "file",
        method: "put",
        timeout: 36000000
    });
  }
})

Vue.component('train', {
  data: function () {
    return {
      show: true,
      snackbarContainer: document.querySelector('#toast'),
      packages: null,
      intervalId: null
    }
  },
  props: {
    currentProject: null
  },
  methods: {
    train_info(){
	    axios.get("/api/training").then(response => {
            this.packages=response.data;
	    });
    },
    download(modelName) {
        console.log(modelName);
	    axios.get("/api/training/"+modelName,{
            responseType: 'arraybuffer'
        }).then(response => {
            var blob=new Blob([response.data])
            console.log(blob);
            saveAs(blob,'trt_graph.pb');
	    });
    }
  },
  created(){
      this.intervalId = setInterval(this.train_info, 5000);
  },
  updated(){
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
        Upload package with the dataset and the labels and click TRAIN.
        After training you will get the <b>trt_graph.pb</b>. 
        Upload it to the deepmicroscopy.
    </div>


    <div class="mdl-card__actions mdl-card--border">

    <dropzone :current-project="currentProject" ref="dropzone"></dropzone>
<br/>
    <a href="/tensorboard" target="_blank" class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored">TENSORBOARD</a>

    </div>

<table class="mdl-data-table mdl-js-data-table mdl-data-table mdl-shadow--2dp">
  <thead>
    <tr>
      <th class="mdl-data-table__cell--non-numeric">Package</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for='package in packages'>
      <td class="mdl-data-table__cell--non-numeric">{{package['name']}}</td>
      <td>
      <a class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored" v-if="package['finished']"  v-on:click="download(package['name'])" >DOWNLOAD</a>
      <a href="/tensorboard" target="_blank" class="mdl-button mdl-js-button mdl-button--raised mdl-button--accent" v-if="!package['finished']" >TRAINING</a> 
      </td>
    </tr>
    </tbody>
</table>



    </div>
    </div>
</main>
  `
});
