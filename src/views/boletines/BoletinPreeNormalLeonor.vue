<template>
  <div>
    <b-button variant="success" block :disabled="generando" @click="generarPDF">
      {{ generando ? 'Generando...' : '📄 Imprimir Boletín / Generar PDF' }}
    </b-button>
  </div>
</template>

<script>
import axios from 'axios'
import * as CONFIG from '@/assets/config.js'

// Portado de academico/src/views/reportes/boletines/BoletinPreeEnslap.vue - boletin de preescolar propio
// de la Escuela Normal Superior Leonor Alvarez Pinzon ("evaluacion por descriptor"), reproduce
// php/boletines/115001002017as.php: tabla de Nombre del Proceso / Ihs / Desempeño, con los descriptores
// (descriptores_pree_<vigencia>) marcados segun la letra D/P/A/S (config.preeL1-4) del periodo actual.
export default {
  name: 'BoletinPreeNormalLeonor',
  props: {
    idMatricula: { type: String, required: true },
    idCurso: { type: String, required: true },
    vigencia: { type: [String, Number], required: true },
    periodosVisibles: { type: Array, required: true },
    estudiante: { type: Object, required: true },
    config: { type: Object, default: () => ({}) }, // fila de secciones_ie
    nombreInstitucion: { type: String, default: '' },
    escudoInstitucion: { type: String, default: '' }
  },
  data () {
    return {
      generando: false,
      listaAreasAsignaturas: [],
      listaDescriptoresRurales: [],
      misNotas: [],
      nombreCurso: '',
      nombreSede: '',
      nombreJornada: '',
      directorCurso: ''
    }
  },
  computed: {
    periodoActual () {
      return this.periodosVisibles[this.periodosVisibles.length - 1]
    },
    tipoValComp () {
      return this.config.tipoValComp != null ? Number(this.config.tipoValComp) : 1
    }
  },
  methods: {
    async generarPDF () {
      this.generando = true
      try {
        const { data } = await axios.get(CONFIG.ROOT_PATH + 'acudientes/boletin/datos', {
          params: {
            idCurso: this.idCurso,
            idMatricula: this.idMatricula,
            vigencia: this.vigencia,
            periodo: this.periodoActual,
            tipoValComp: this.tipoValComp,
            promCompor: 1
          }
        })
        if (data.error || !data.datos) {
          this.mensajeEmergente('danger', 'No se pudo generar el boletín. ' + (data.mensaje || ''))
          return
        }
        this.listaAreasAsignaturas = data.datos.listaAreasAsignaturas || []
        this.listaDescriptoresRurales = data.datos.listaDescriptoresRurales || []
        this.misNotas = data.datos.misNotas || []
        this.nombreCurso = data.datos.nombreCurso || this.estudiante.curso || ''
        this.nombreSede = data.datos.nombreSede || this.estudiante.sede || ''
        this.nombreJornada = data.datos.nombreJornada || this.estudiante.jornada || ''
        this.directorCurso = data.datos.directorCurso || ''

        const estructura = this.estructurarNotasPorEstudiante()
        const clave = Object.keys(estructura)[0]
        const ventana = window.open('', '_blank')
        const contenido = `
          <html>
          <head>
            <title>Boletín</title>
            <style>${this.estilosBoletin()}</style>
          </head>
          <body>
            ${this.renderBoletin(estructura[clave])}
            <script>
              window.addEventListener('load', function () {
                try { window.focus() } catch (e) {}
                setTimeout(function () { try { window.print() } catch (e) {} }, 300)
              })
            <\/script>
          </body>
          </html>
        `
        ventana.document.write(contenido)
        ventana.document.close()
      } catch (e) {
        this.mensajeEmergente('danger', 'Error generando el boletín. ' + e)
      } finally {
        this.generando = false
      }
    },

    mensajeEmergente (variante, contenido) {
      this.$bvToast.toast(contenido, { title: CONFIG.TITULO_MSG, variant: variante, toaster: 'b-toaster-top-center', solid: true, autoHideDelay: 4000, appendToast: false })
    },

    nombreDelArea (area) {
      const registro = this.listaAreasAsignaturas.find(a => a.area === area && a.nombreArea)
      return registro?.nombreArea || area
    },
    tieneNotasAsignatura (est, area, asignatura) {
      return !!est.areas?.[area]?.asignaturas?.[asignatura]
    },
    tieneNotasArea (est, area) {
      const asignaturas = Object.keys(est.areas?.[area]?.asignaturas || {})
      return asignaturas.some(asig => this.tieneNotasAsignatura(est, area, asig))
    },
    // Letra del periodo actual: comportamiento usa la escala compL1..4, el resto la escala preeL1..4
    letraPeriodo (datos, orden) {
      return orden === 99 ? datos?.definitivacompor : datos?.definitivapree
    },
    desempeno (datos, orden) {
      if (!datos) return ''
      const letra = this.letraPeriodo(datos, orden)
      if (!letra) return ''
      const c = this.config
      if (orden === 99) {
        if (letra === c.compL1) return c.compC1
        if (letra === c.compL2) return c.compC2
        if (letra === c.compL3) return c.compC3
        if (letra === c.compL4) return c.compC4
      } else {
        if (letra === c.preeL1) return c.preeC1
        if (letra === c.preeL2) return c.preeC2
        if (letra === c.preeL3) return c.preeC3
        if (letra === c.preeL4) return c.preeC4
      }
      return ''
    },
    leyendaEscala () {
      const c = this.config
      return `${c.preeC1}: [${c.preeL1}] ${c.preeC2}: [${c.preeL2}] ${c.preeC3}: [${c.preeL3}] ${c.preeC4}: [${c.preeL4}]`
    },
    // Reproduce el emparejamiento de descriptores_pree_<vigencia>: orden 1-4 segun la letra exacta
    // (config.preeL1-4) y orden 5-6 como texto adicional de grupo (L1-o-L2 / L3-o-L4).
    descriptoresAsignatura (est, area, asignatura, orden) {
      const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
      const datos = est.areas?.[area]?.asignaturas?.[asignatura]
      if (!meta || !datos) return []
      if (datos.pd === 'S' || datos.concep === 'S') {
        return datos.inclusion ? [datos.inclusion] : []
      }
      const letra = this.letraPeriodo(datos, orden)
      if (!letra) return []
      const c = this.config
      const filas = this.listaDescriptoresRurales.filter(d => d.idAsignaturaCurso === meta.idAsignaturaCurso)
      const resultado = []
      filas.forEach(d => {
        if (d.orden == 1 && letra === c.preeL1) resultado.push(d.descriptor)
        else if (d.orden == 2 && letra === c.preeL2) resultado.push(d.descriptor)
        else if (d.orden == 3 && letra === c.preeL3) resultado.push(d.descriptor)
        else if (d.orden == 4 && letra === c.preeL4) resultado.push(d.descriptor)
        else if (d.orden == 5 && (letra === c.preeL1 || letra === c.preeL2)) resultado.push(d.descriptor)
        else if (d.orden == 6 && (letra === c.preeL3 || letra === c.preeL4)) resultado.push(d.descriptor)
      })
      return resultado
    },
    observacionComportamiento (est) {
      const compo = this.listaAreasAsignaturas.find(a => a.orden === 99)
      if (!compo) return ''
      const datos = est.areas?.[compo.area]?.asignaturas?.[compo.asignatura]
      return datos?.observaciones || ''
    },
    ausenciasComportamiento (est, tipo) {
      const compo = this.listaAreasAsignaturas.find(a => a.orden === 99)
      if (!compo) return 0
      const datos = est.areas?.[compo.area]?.asignaturas?.[compo.asignatura]
      return Number(datos?.[tipo]) || 0
    },

    estructurarNotasPorEstudiante () {
      const mapa = {}
      this.misNotas.forEach(nota => {
        const {
          estudiante, documento, area, asignatura,
          definitivacompor, definitivapree, periodo, inclusion,
          observaciones, pd, concep, totalAJ, totalAS, totalAJTodos, totalASTodos
        } = nota
        if (!mapa[estudiante]) {
          mapa[estudiante] = { documento, ausJTodos: 0, ausSTodos: 0, areas: {} }
        }
        const est = mapa[estudiante]
        if (!est.areas[area]) est.areas[area] = { asignaturas: {} }
        if (!est.areas[area].asignaturas[asignatura]) {
          const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
          est.areas[area].asignaturas[asignatura] = {
            orden: meta?.orden || 0,
            definitivacompor: null,
            definitivapree: null,
            inclusion: null,
            observaciones: null,
            pd: null,
            concep: null,
            ausJ: 0,
            ausS: 0,
            ausJTodos: 0,
            ausSTodos: 0
          }
        }
        const asig = est.areas[area].asignaturas[asignatura]
        // El periodo actual manda sobre el valor mostrado en el boletin (matriz por asignatura)
        if (periodo === this.periodoActual) {
          asig.definitivacompor = definitivacompor
          asig.definitivapree = definitivapree
          asig.inclusion = inclusion
          asig.observaciones = observaciones
          asig.pd = pd
          asig.concep = concep
        }
        asig.ausJ += Number(totalAJ) || 0
        asig.ausS += Number(totalAS) || 0
        asig.ausJTodos += Number(totalAJTodos) || 0
        asig.ausSTodos += Number(totalASTodos) || 0

        est.ausJTodos += Number(totalAJTodos) || 0
        est.ausSTodos += Number(totalASTodos) || 0
      })
      return mapa
    },

    renderBoletin (estudianteData) {
      if (!estudianteData) return `<p>No hay datos para ${this.estudiante.estudiante}</p>`
      let cuerpo = `
        <div class="boletin">
          <div class="text-center mt-2">
            <p style="text-align: center; font-size: 14px;">SECRETARÍA DE EDUCACIÓN TERRITORIAL DE TUNJA<br><b>${this.nombreInstitucion}</b><br>TUNJA - BOYACÁ<br>INFORME DE EVALUACIÓN POR PERIODO</p>
          </div>
          <div class="float-left" style="margin-top: -80px;">
              <img src="${this.escudoInstitucion}" width="70px"></img>
          </div>
          <table class="tabla-boletin">
            <thead>
              <tr>
                <th style="width:10%; text-align: left">Estudiante:</th><th style="text-align: left">${this.estudiante.estudiante}</th>
                <th colspan="2" style="text-align: left">Modalidad:</th><th colspan="2" style="text-align: left">ACADÉMICA</th>
                <th style="text-align: left">Vigencia:</th><th style="text-align: left">${this.vigencia}</th>
              </tr>
              <tr>
                  <th style="text-align: left">Sede:</th><th style="text-align: left">${this.nombreSede}</th>
                  <th style="text-align: left">Jornada:</th><th style="text-align: left">${this.nombreJornada}</th>
                  <th style="text-align: left">Curso:</th><th style="text-align: left">${this.nombreCurso}</th>
                  <th style="text-align: left">Periodo:</th><th style="text-align: left">${this.periodosVisibles.length > 1 ? ('Acumulado ' + this.periodosVisibles[0] + '-' + this.periodoActual) : ('Periodo ' + this.periodoActual)}</th>
              </tr>
            </thead>
          </table>
          <table class="tabla-boletin">
            <thead>
              <tr>
                <th rowspan="2" style="width:34%">Nombre del Proceso</th>
                <th rowspan="2" style="width:6%">Ihs</th>
                <th rowspan="2" style="width:22%">Desempeño</th>
                <th colspan="2" style="width:10%">Ausencias Período</th>
                <th colspan="2" style="width:10%">Ausencias Totales</th>
              </tr>
              <tr>
                <th style="width:5%">AJ</th>
                <th style="width:5%">AS</th>
                <th style="width:5%">TAJ</th>
                <th style="width:5%">TAS</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderCuerpoTabla(estudianteData)}
            </tbody>
          </table>
          <table class="tabla-boletin">
            <tr>
              <td style="width: 25%; text-align: left">Aus. Justificadas Periodo: <b>${this.ausenciasComportamiento(estudianteData, 'ausJ')}</b></td>
              <td style="width: 25%; text-align: left">Aus. Sin Justificar Periodo: <b>${this.ausenciasComportamiento(estudianteData, 'ausS')}</b></td>
              <td style="width: 25%; text-align: left">Aus. Justificadas Total: <b>${estudianteData.ausJTodos}</b></td>
              <td style="width: 25%; text-align: left">Aus. Sin Justificar Total: <b>${estudianteData.ausSTodos}</b></td>
            </tr>
          </table>
          <table class="tabla-boletin">
            <tr>
              <td style="width: 100%; text-align: left"><b>Observaciones: </b>${this.observacionComportamiento(estudianteData)}</td>
            </tr>
          </table>
          <div style="text-align: right; font-size: 12px; margin-top: 5px;">
            <i>${this.leyendaEscala()} | Fecha: ${new Date().toISOString().slice(0, 10)}</i>
          </div>
          <table class="firmas" style="width: 100%;">
            <tr>
              <td style="width: 50%;">
                <p>________________________________________<br>${this.directorCurso}<br>Firma Director(a) de Curso</p>
              </td>
            </tr>
          </table>
      `
      return cuerpo
    },
    renderCuerpoTabla (data) {
      const areas = [...new Set(this.listaAreasAsignaturas.map(a => a.area))]
        .filter(area => this.tieneNotasArea(data, area))
      return areas.map(area => {
        const asigns = this.listaAreasAsignaturas.filter(a => a.area === area && this.tieneNotasAsignatura(data, area, a.asignatura))
        const filasArea = `
          <tr class="fila-area">
            <td colspan="7" style="text-align: left">${this.nombreDelArea(area)}</td>
          </tr>
        `
        const filasAsignaturas = asigns.map(asig => {
          const a = asig.asignatura
          const orden = asig.orden
          const datos = data.areas?.[area]?.asignaturas?.[a]
          const desempeno = this.desempeno(datos, orden)
          const ausJ = Number(datos?.ausJ) || 0
          const ausS = Number(datos?.ausS) || 0
          const tAJ = Number(datos?.ausJTodos) || 0
          const tAS = Number(datos?.ausSTodos) || 0
          const descriptores = this.descriptoresAsignatura(data, area, a, orden)
          return `
            <tr>
              <td style="text-align: left"><strong>${asig.nombreAsignatura}</strong> <br> <i style="font-size: 10px;">${asig.docente || ''}</i></td>
              <td>${asig.ih}</td>
              <td>${desempeno}</td>
              <td>${ausJ > 0 ? ausJ : ''}</td>
              <td>${ausS > 0 ? ausS : ''}</td>
              <td>${tAJ > 0 ? tAJ : ''}</td>
              <td>${tAS > 0 ? tAS : ''}</td>
            </tr>
            ${descriptores.map(d => `<tr><td colspan="7" class="descriptor" style="text-align: left">${d}</td></tr>`).join('')}
          `
        }).join('')
        return filasArea + filasAsignaturas
      }).join('')
    },
    estilosBoletin () {
      return `
        body { font-family: Arial, sans-serif; margin: 5px; }
        .boletin { page-break-after: always; }
        .tabla-boletin { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-top: 0.5rem; }
        .tabla-boletin th, .tabla-boletin td { border: 1px solid #ccc; padding: 2px 4px; text-align: center; }
        .fila-area { background-color: #f0f0f0; font-weight: bold; }
        .descriptor { font-style: italic; background-color: #f9f9f9; text-align: left; }
        .firmas { margin-top: 3rem; font-size: 0.8rem; }
      `
    }
  }
}
</script>
