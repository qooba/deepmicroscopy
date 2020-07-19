
Vue.component('camera', {
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
      pc: null,
      eval: false,
      models: null,
      model: null,
      ws: null,
      stats: null
    }
  },
  props: {
    currentProject: null
  },
  methods: {
    negotiate: function() {
        pc.addTransceiver('video', {direction: 'recvonly'});
        return pc.createOffer().then(function(offer) {
            return pc.setLocalDescription(offer);
        }).then(function() {
            // wait for ICE gathering to complete
            return new Promise(function(resolve) {
                if (pc.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    function checkState() {
                        if (pc.iceGatheringState === 'complete') {
                            pc.removeEventListener('icegatheringstatechange', checkState);
                            resolve();
                        }
                    }
                    pc.addEventListener('icegatheringstatechange', checkState);
                }
            });
        }).then(function() {
            var offer = pc.localDescription;

            return fetch('/offer', {

                body: JSON.stringify({
                    sdp: offer.sdp,
                    type: offer.type,
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                method: 'POST'
            });
        }).then(function(response) {
            return response.json();
        }).then(function(answer) {
            console.log(answer)
            return pc.setRemoteDescription(answer);
        }).catch(function(e) {
            alert(e);
        });
    },

    start: function() {
        var config = {
            sdpSemantics: 'unified-plan'
        };
        //config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
        pc = new RTCPeerConnection(config);
    
        // connect audio / video
        pc.addEventListener('track', function(evt) {
            if (evt.track.kind == 'video') {
                console.log(evt)
                stream = evt.streams[0];
                //window.stream = stream;
                video=document.getElementById('video')
                video.srcObject = stream;
            }
        });
    
        this.negotiate();
    },

    stop: function() {
        setTimeout(function() {
            pc.close();
        }, 500);
    },

    capture: function() {
      	var data = {
        	message: 'Image captured',
	        timeout: 100
      	};

 
	    axios.post("/api/video/capture", {
	      bucketName: this.$props.currentProject,
	      objectName: Date.now().toString()+".jpg",
	      contentType: "image/jpg"
	    }).then(response => {
	    	console.log(response);
	    });

      	this.snackbarContainer.MaterialSnackbar.showSnackbar(data);
    },
    reload: function(currentProject, isEval){
        this.eval=isEval;
        if(this.eval){
            axios
            .get("/api/projects/"+currentProject+"/models")
            .then(response => {
                console.log(response);
                this.models=response.data;
            });
        }
    },
    changeModel: function(){
        console.log(this.model);
    },
    runModel: function(action){
	    axios.post("/api/projects/"+this.currentProject+"/model", {
	      model: this.model,
          action: action,
	      timestamp: Date.now().toString()
	    }).then(response => {
	    	console.log(response);
	    });
    },
    groupBy: function(xs, key) {
          return xs.reduce(function(rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
          }, {});
    },
    handleStats: function(event) {
        data=JSON.parse(event.data);
        //console.log(data)
        this.stats=this.groupBy(data,'class');
        for(k in this.stats) { 
            var averageScore=0;
            var averageWidth=0;
            var averageHeight=0;
            var stat=this.stats[k]; 
            for(l in stat) {
                var res=stat[l];
                averageScore+=res.scores; 
                averageWidth+=res.box[2]; 
                averageHeight+=res.box[3]; 
            };
            
            stat['averageScore']=(averageScore/stat.length).toFixed(2); 
            stat['averageHeight']=(averageHeight/stat.length).toFixed(2); 
            stat['averageWidth']=(averageWidth/stat.length).toFixed(2); 
        }
        //dialog.showModal()
        // toast.MaterialSnackbar.showSnackbar(data);
    },
    showStats: function() {
        this.ws = new WebSocket("wss://"+window.location.host+"/ws");
        this.ws.onmessage = this.handleStats;
    },
    hideStats: function() {
        this.ws.close();
        this.ws=null;
    }
  },
  updated(){
  },
  template: `
  <main class="mdl-layout__content mdl-color--grey-100" v-if="show">

  <div class="mdl-grid demo-content" v-if="eval">
    <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
      <select class="mdl-textfield__input" id="modelsList" name="modelsList" v-model="model" @change="changeModel()">
        <option></option>
        <option v-for="model in models" :value="model" v-on:click="changeModel()">{{ model }}</option>
      </select>
      <label class="mdl-textfield__label" for="modelsList" v-if="model === null">Models List</label>
    </div>

    <button class="mdl-button mdl-js-button eval-button" v-on:click="runModel('load')">RUN</button>
    <button class="mdl-button mdl-js-button eval-button" v-on:click="runModel('unload')">CLEAR</button>
    <button class="mdl-button mdl-js-button eval-button" v-on:click="showStats()" v-if="ws === null">SHOW STATS</button>
    <button class="mdl-button mdl-js-button eval-button" v-on:click="hideStats()" v-if="ws !== null">HIDE STATS</button>
  </div>
    
  <div class="mdl-grid demo-content" v-if="ws !== null">
   

<table class="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp">
  <thead>
    <tr>
      <th class="mdl-data-table__cell--non-numeric">Class</th>
      <th>Items Number</th>
      <th>Average Width</th>
      <th>Average Height</th>
      <th>Average Score</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="stat in stats">
      <td class="mdl-data-table__cell--non-numeric">{{ stat[0].class }}</td>
      <td>{{ stat.length }}</td>
      <td>{{ stat.averageWidth }}</td>
      <td>{{ stat.averageHeight }}</td>
      <td>{{ stat.averageScore }}</td>
    </tr>
  </tbody>
</table>









  </div>

  <div class="mdl-grid demo-content">
      <div class="mdl-cell mdl-cell--6-col">
          <div class="demo-card-wide mdl-card camera mdl-shadow--2dp">
            <video id="video" autoplay muted playsinline></video>
            <div class="mdl-card__actions mdl-card--border">
                  <button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab" v-on:click="start">
                      <i class="material-icons">play_arrow</i>
                  </button>
                  <button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab" v-on:click="stop">
                      <i class="material-icons">pause</i>
                  </button>
                  <button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab" v-on:click="stop">
                      <i class="material-icons">stop</i>
                  </button>
                  <button class="mdl-button mdl-js-button mdl-button--fab mdl-button--mini-fab" v-on:click="capture">                  
                    <i class="material-icons">add</i>
                  </button>
              </div>
          </div>
      </div>
  </div>
</main>
  `
});
