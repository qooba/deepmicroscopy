Vue.component('home', {
  data: function () {
    return {
      count: 0,
      message: "hello",
      show: true,
      interval: null,
      imageBytes: null,
      imageBlob: null,
      notinitialized: true,
      snackbarContainer: document.querySelector('#toast')
    }
  },
  props: {
    currentProject: null
  },
  methods: {
    
  },
  template: `
  <main class="mdl-layout__content mdl-color--grey-100" v-if="show">
        
          <div class="mdl-grid demo-content" > HOME
          </div>
    </main>
  `
});