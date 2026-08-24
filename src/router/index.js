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
          path: 'estudiante/:idMatricula/notas-normal-santiago',
          name: 'consulta-notas-normal-santiago',
          component: () => import('@/views/notas/ConsultaNotasNormalSantiago')
        },
        {
          path: 'estudiante/:idMatricula/notas-normal-leonor',
          name: 'consulta-notas-normal-leonor',
          component: () => import('@/views/notas/ConsultaNotasNormalLeonor')
        },
        {
          path: 'estudiante/:idMatricula/notas-antonio-jose',
          name: 'consulta-notas-antonio-jose',
          component: () => import('@/views/notas/ConsultaNotasAntonioJose')
        },
        {
          path: 'estudiante/:idMatricula/notas-gran-colombiano',
          name: 'consulta-notas-gran-colombiano',
          component: () => import('@/views/notas/ConsultaNotasGranColombiano')
        },
        {
          path: 'estudiante/:idMatricula/notas-gustavo-rojas',
          name: 'consulta-notas-gustavo-rojas',
          component: () => import('@/views/notas/ConsultaNotasGustavoRojas')
        },
        {
          path: 'estudiante/:idMatricula/notas-julius-sieber',
          name: 'consulta-notas-julius-sieber',
          component: () => import('@/views/notas/ConsultaNotasJuliusSieber')
        },
        {
          path: 'estudiante/:idMatricula/notas-libertador',
          name: 'consulta-notas-libertador',
          component: () => import('@/views/notas/ConsultaNotasLibertador')
        },
        {
          path: 'estudiante/:idMatricula/notas-rural-sur',
          name: 'consulta-notas-rural-sur',
          component: () => import('@/views/notas/ConsultaNotasRuralSur')
        },
        {
          path: 'estudiante/:idMatricula/notas-san-jeronimo',
          name: 'consulta-notas-san-jeronimo',
          component: () => import('@/views/notas/ConsultaNotasSanJeronimo')
        },
        {
          path: 'estudiante/:idMatricula/notas-silvino-rodriguez',
          name: 'consulta-notas-silvino-rodriguez',
          component: () => import('@/views/notas/ConsultaNotasSilvinoRodriguez')
        },
        {
          path: 'estudiante/:idMatricula/notas-tecnico-gonzalo-suarez',
          name: 'consulta-notas-tecnico-gonzalo-suarez',
          component: () => import('@/views/notas/ConsultaNotasTecnicoGonzaloSuarez')
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

