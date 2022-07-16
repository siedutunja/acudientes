import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  mode: 'hash', // https://router.vuejs.org/api/#mode
  linkActiveClass: 'active',
  scrollBehavior: () => ({ y: 0 }),
  routes: configRoutes()
})

function configRoutes () {
  return [
    {
      path: '/',
      redirect: '/',
      component: {
        render (c) { return c('router-view') }
      },
      children: [
        {
          path: '',
          component: () => import('@/views/Login')
        },
        {
          path: 'recuperaclave',
          component: () => import('@/views/pages/RecuperaClave')
        }
      ]
    },
    {
      path: "*",
      component: () => import('@/views/Login')
    },
  ]
}

