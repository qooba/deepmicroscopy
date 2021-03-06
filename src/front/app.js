app=new Vue({ 
  el: '#app',
  data: {
    projects: [],
    currentProject: null,
    dialog: null,
    newProjectDialog: null,
    ws: null,
    toast: null
  },
  methods: {
    home: function () {
      this.$refs.home.show=true;
      this.$refs.annotator.show=false;
      this.$refs.camera.show=false;
      this.$refs.train.show=false;
      this.$refs.camera.reload(this.currentProject, false);
    },
    capture: function () {
      this.$refs.home.show=false;
      this.$refs.annotator.show=false;
      this.$refs.camera.show=true;
      this.$refs.train.show=false;
      this.$refs.camera.reload(this.currentProject, false);
    },
    annotate: function () {
      this.$refs.home.show=false;
      this.$refs.annotator.show=true;
      this.$refs.camera.show=false;
      this.$refs.train.show=false;
      this.$refs.camera.reload(this.currentProject, false);
    },
    train: function () {
      this.$refs.home.show=false;
      this.$refs.annotator.show=false;
      this.$refs.camera.show=false;
      this.$refs.train.show=true;
      this.$refs.camera.reload(this.currentProject, false);
    },
    execute: function () {
      this.$refs.home.show=false;
      this.$refs.annotator.show=false;
      this.$refs.camera.show=true;
      this.$refs.train.show=false;
      this.$refs.camera.reload(this.currentProject, true);
    },
    create_project: function() {
      refreshProjects=this.refreshProjects;
      this.newProjectDialog.showModal();
      this.newProjectDialog.querySelector('.close').addEventListener('click', function() {
          newProjectDialog.close();
      });
      this.newProjectDialog.querySelector('.create').addEventListener('click', function() {
          newProjectName=newProjectDialog.querySelector('#new_project_name').value;
          console.log(newProjectName)
  	    axios.post("/api/projects", {
  	      name: newProjectName
  	    }).then(async response => {
            await refreshProjects();
  	    	console.log(response);
  	    });
  
          newProjectDialog.close();
      });
    },
    sendMessage: function(message) {
      this.ws.send(message)
    },
    changeProject: function(name){
      this.currentProject = name;
      if(this.$refs.annotator.show===true){
        this.$refs.annotator.reload(this.currentProject);
      } else if(this.$refs.camera.eval==true) {
        this.$refs.camera.reload(this.currentProject, true);
      }
    },
    refreshProjects: function(){
      return axios
      .get("/api/projects")
      .then(response => {
        console.log(response)
        this.projects = response.data;
        if(this.projects.length != 0){
          this.currentProject = this.projects[0].name;
        }
      })

    }
  },
  created: function () {
    this.refreshProjects();
    dialog = document.querySelector('#dialog');
    this.newProjectDialog = document.querySelector('#newProjectDialog');
    toast = document.querySelector('#toast');
  }  
});

dialogAcitions=new Vue({ 
  el: '#dialog_acitions',
  data: {
  },
  methods: {
    cancel: function() {
      console.log('test')
      this.dialog.close();
    }
  },
  created: function () {
    this.dialog = document.querySelector('#dialog');
  }
})
