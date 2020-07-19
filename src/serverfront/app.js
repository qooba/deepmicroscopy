app=new Vue({ 
  el: '#app',
  data: {
    projects: [],
    currentProject: null,
    dialog: null,
    newProjectDialog: null,
    toast: null,
    ws: null
  },
  methods: {
    train() {
        this.$refs.train.show=true;
    },
    handleEvent(event) {
        data=JSON.parse(event.data);
    }
  },
  created: function () {
    dialog = document.querySelector('#dialog');
    toast = document.querySelector('#toast');
    this.ws = new WebSocket("wss://"+window.location.host+"/ws");
    this.ws.onmessage = this.handleEvent;
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
