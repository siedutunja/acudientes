import 'core-js/stable'
import Vue from 'vue'
import App from './App'
import router from './router'
import CoreuiVue from '@coreui/vue'
import { iconsSet as icons } from './assets/icons/icons.js'
import store from './store'

import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
Vue.use(BootstrapVue)
Vue.use (IconsPlugin)
import 'bootstrap-vue/dist/bootstrap-vue.css'

import UUID from "vue-uuid"
Vue.use(UUID)

Vue.config.performance = true
Vue.use(CoreuiVue)
Vue.prototype.$log = console.log.bind(console)

new Vue({
  el: '#app',
  router,
  store,
  icons,
  template: '<App/>',
  components: {
    App
  }
})
