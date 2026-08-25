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

// Portado de academico/src/views/reportes/boletines/BoletinPreeRural.vue - boletin de preescolar propio
// de la IE Rural del Sur ("evaluacion por descriptor"), reproduce php/boletines/215001001007as.php: tabla
// de Nombre del Dimension / Ihs / Logrado / En Proceso / Recomendacion, marcada segun L/E/R guardado en
// las columnas concC1..concC10 de notas_parciales para esa asignatura y periodo.
export default {
  name: 'BoletinPreeRuralSur',
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

    // Reproduce el emparejamiento de descriptores_pree_<vigencia>: cada descriptor (orden 1-10) se
    // marca segun el valor L/E/R guardado en la columna concC<orden> de notas_parciales para esa asignatura.
    descriptoresAsignatura (est, area, asignatura) {
      const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
      const datos = est.areas?.[area]?.asignaturas?.[asignatura]
      if (!meta || !datos) return []
      const filas = this.listaDescriptoresRurales.filter(d => d.idAsignaturaCurso === meta.idAsignaturaCurso)
      const resultado = []
      filas.forEach(d => {
        const tipo = datos['concC' + d.orden]
        if (tipo === 'L' || tipo === 'E' || tipo === 'R') {
          resultado.push({ descriptor: d.descriptor, tipo })
        }
      })
      return resultado
    },

    estructurarNotasPorEstudiante () {
      const mapa = {}
      this.misNotas.forEach(nota => {
        const {
          estudiante, documento, area, asignatura, orden, periodo,
          totalAJ, totalAS, totalAJTodos, totalASTodos,
          concC1, concC2, concC3, concC4, concC5, concC6, concC7, concC8, concC9, concC10
        } = nota
        if (!mapa[estudiante]) {
          mapa[estudiante] = {
            documento,
            ausJ: 0,
            ausS: 0,
            ausJTodos: 0,
            ausSTodos: 0,
            observaciones: '',
            areas: {}
          }
        }
        const est = mapa[estudiante]
        if (!est.areas[area]) est.areas[area] = { asignaturas: {} }
        if (!est.areas[area].asignaturas[asignatura]) {
          const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
          est.areas[area].asignaturas[asignatura] = {
            orden: meta?.orden || 0,
            concC1: null, concC2: null, concC3: null, concC4: null, concC5: null,
            concC6: null, concC7: null, concC8: null, concC9: null, concC10: null,
            ausJ: 0,
            ausS: 0,
            ausJTodos: 0,
            ausSTodos: 0
          }
        }
        const asig = est.areas[area].asignaturas[asignatura]
        // El periodo actual manda sobre las marcas L/E/R mostradas en el boletin (matriz por asignatura)
        if (periodo === this.periodoActual) {
          Object.assign(asig, { concC1, concC2, concC3, concC4, concC5, concC6, concC7, concC8, concC9, concC10 })
        }
        asig.ausJ += Number(totalAJ) || 0
        asig.ausS += Number(totalAS) || 0
        asig.ausJTodos += Number(totalAJTodos) || 0
        asig.ausSTodos += Number(totalASTodos) || 0

        est.ausJ += Number(totalAJ) || 0
        est.ausS += Number(totalAS) || 0
        est.ausJTodos += Number(totalAJTodos) || 0
        est.ausSTodos += Number(totalASTodos) || 0

        if (orden === 99) est.observaciones = '-'
      })
      return mapa
    },

    renderBoletin (data) {
      if (!data) return `<p>No hay datos para ${this.estudiante.estudiante}</p>`
      return `
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
                <th rowspan="2" style="width:32%">Nombre del Dimensión</th>
                <th rowspan="2" style="width:6%">Ihs</th>
                <th rowspan="2" style="width:10%">Logrado</th>
                <th rowspan="2" style="width:10%">En Proceso</th>
                <th rowspan="2" style="width:12%">Recomendación</th>
                <th colspan="2" style="width:16%">Ausencias Período</th>
                <th colspan="2" style="width:16%">Ausencias Totales</th>
              </tr>
              <tr>
                <th style="width:8%">AJ</th>
                <th style="width:8%">AS</th>
                <th style="width:8%">TAJ</th>
                <th style="width:8%">TAS</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderCuerpoTabla(data)}
            </tbody>
          </table>
          <table class="tabla-boletin">
            <tr>
              <td style="width: 25%; text-align: left">Aus. Justificadas Periodo: <b>${data.ausJ}</b></td>
              <td style="width: 25%; text-align: left">Aus. Sin Justificar Periodo: <b>${data.ausS}</b></td>
              <td style="width: 25%; text-align: left">Aus. Justificadas Total: <b>${data.ausJTodos}</b></td>
              <td style="width: 25%; text-align: left">Aus. Sin Justificar Total: <b>${data.ausSTodos}</b></td>
            </tr>
          </table>
          <table class="tabla-boletin">
            <tr>
              <td style="width: 100%; text-align: left"><b>Observaciones: </b>${data.observaciones}</td>
            </tr>
          </table>
          <table class="firmas" style="width: 100%;">
            <tr>
              <td style="width: 50%;">
                <p>________________________________________<br>${this.directorCurso}<br>Firma Director(a) de Curso</p>
              </td>
            </tr>
          </table>
      `
    },
    renderCuerpoTabla (data) {
      const areas = [...new Set(this.listaAreasAsignaturas.map(a => a.area))]
      return areas.map(area => {
        const asigns = this.listaAreasAsignaturas.filter(a => a.area === area)
        return asigns.map(asig => {
          const a = asig.asignatura
          const datos = data.areas?.[area]?.asignaturas?.[a]
          const ausJ = Number(datos?.ausJ) || 0
          const ausS = Number(datos?.ausS) || 0
          const tAJ = Number(datos?.ausJTodos) || 0
          const tAS = Number(datos?.ausSTodos) || 0
          const descriptores = this.descriptoresAsignatura(data, area, a)
          const filaAsignatura = `
            <tr>
              <td style="text-align: left"><strong>${asig.nombreAsignatura}</strong> <br> <i style="font-size: 10px;">${asig.docente || ''}</i></td>
              <td>${asig.ih}</td>
              <td></td>
              <td></td>
              <td></td>
              <td>${ausJ > 0 ? ausJ : ''}</td>
              <td>${ausS > 0 ? ausS : ''}</td>
              <td>${tAJ > 0 ? tAJ : ''}</td>
              <td>${tAS > 0 ? tAS : ''}</td>
            </tr>
          `
          const filasDescriptores = descriptores.map(d => `
            <tr>
              <td colspan="2" class="descriptor" style="text-align: left">${d.descriptor}</td>
              <td>${d.tipo === 'L' ? 'X' : ''}</td>
              <td>${d.tipo === 'E' ? 'X' : ''}</td>
              <td>${d.tipo === 'R' ? 'X' : ''}</td>
              <td colspan="4"></td>
            </tr>
          `).join('')
          return filaAsignatura + filasDescriptores
        }).join('')
      }).join('')
    },
    estilosBoletin () {
      return `
        body { font-family: Arial, sans-serif; margin: 5px; }
        .boletin { page-break-after: always; }
        .tabla-boletin { width: 100%; border-collapse: collapse; font-size: 0.75rem; margin-top: 0.5rem; }
        .tabla-boletin th, .tabla-boletin td { border: 1px solid #ccc; padding: 2px 4px; text-align: center; }
        .descriptor { font-style: italic; background-color: #f9f9f9; text-align: left; }
        .firmas { margin-top: 3rem; font-size: 0.8rem; }
      `
    }
  }
}
</script>
