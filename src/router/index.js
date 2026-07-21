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
      redirect: '/inicio',
      name: 'Home',
      component: () => import('@/containers/TheContainer'),
      children: [
        {
          path: 'inicio',
          name: 'inicio-acudiente',
          component: () => import('@/views/acudientes/PanelAcudiente')
        },
        {
          path: 'estudiante/:idMatricula/menu',
          name: 'menu-estudiante',
          component: () => import('@/views/acudientes/MenuEstudiante')
        },
        {
          path: 'estudiante/:idMatricula/observador',
          name: 'observador-estudiante',
          component: () => import('@/views/acudientes/ObservadorEstudiante')
        },
        {
          path: 'estudiante/:idMatricula/notas',
          name: 'historico-notas-estudiante',
          component: () => import('@/views/notas/HistoricoNotasEstudiante')
        },
        {
          path: 'estudiante/:idMatricula/notas-inem',
          name: 'consulta-notas-inem',
          component: () => import('@/views/notas/ConsultaNotasInem')
        },
        {
          path: 'estudiante/:idMatricula/matricula',
          name: 'matricula-estudiante',
          component: () => import('@/views/acudientes/MatriculaEstudiante')
        }
      ]
    },
    {
      path: "*",
      redirect: '/inicio'
    }
  ]
}

