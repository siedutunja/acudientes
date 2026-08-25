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

// Portado de academico/src/views/reportes/boletines/BoletinPeriodo.vue (version 2026-08, ver reportes.rar)
// - sin ramas de negocio especiales de un colegio en particular.
// COL_DESEM=7 activa el modo "criterios" (muestra C1/C2/C3 configurados en vez de Evalua/Recup) -
// asi se ve el boletin oficial en academico para este colegio segun su codigo DANE.
const COL_DESEM = 6

export default {
  name: 'BoletinLibertador',
  props: {
    idMatricula: { type: String, required: true },
    idCurso: { type: String, required: true },
    vigencia: { type: [String, Number], required: true },
    periodosVisibles: { type: Array, required: true }, // ej. [1] o [1,2,3,4]
    estudiante: { type: Object, required: true }, // { estudiante, documento, sede, curso, jornada, ... }
    config: { type: Object, default: () => ({}) }, // fila de secciones_ie
    nombreInstitucion: { type: String, default: '' },
    escudoInstitucion: { type: String, default: '' }
  },
  data () {
    return {
      generando: false,
      listaAreasAsignaturas: [],
      listaDescriptores: [],
      misNotas: [],
      nombreCurso: '',
      nombreSede: '',
      nombreJornada: '',
      directorCurso: '',
      puesto: null,
      totalEstudiantes: null,
      escala: 0
    }
  },
  computed: {
    periodoActual () {
      return this.periodosVisibles[this.periodosVisibles.length - 1]
    },
    umbralesA () {
      return [Number(this.config.maxBaj), Number(this.config.maxBas), Number(this.config.maxAlt), Number(this.config.maxSup)]
    },
    umbralesT () {
      return [Number(this.config.maxBajT), Number(this.config.maxBasT), Number(this.config.maxAltT), Number(this.config.maxSupT)]
    },
    tipoValComp () {
      return this.config.tipoValComp != null ? Number(this.config.tipoValComp) : 1
    },
    promCompor () {
      return this.config.promCompor != null ? Number(this.config.promCompor) : 1
    },
    // Estudiante evaluado de forma conceptual: no se calcula promedio/puesto general
    esConceptual () {
      return String(this.estudiante.conceptual || '').trim().toUpperCase() === 'S'
    },
    // Letras/etiquetas de comportamiento configuradas por el colegio (secciones_ie), en orden BAJO->SUPERIOR
    letrasCompor () {
      const c = this.config
      return [c.compL1, c.compL2, c.compL3, c.compL4]
    },
    labelsCompor () {
      const c = this.config
      return [c.compC1, c.compC2, c.compC3, c.compC4]
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
            promCompor: this.promCompor
          }
        })
        if (data.error || !data.datos) {
          this.mensajeEmergente('danger', 'No se pudo generar el boletín. ' + (data.mensaje || ''))
          return
        }
        this.listaAreasAsignaturas = data.datos.listaAreasAsignaturas || []
        this.listaDescriptores = data.datos.listaDescriptores || []
        this.misNotas = data.datos.misNotas || []
        this.nombreCurso = data.datos.nombreCurso || this.estudiante.curso || ''
        this.nombreSede = data.datos.nombreSede || this.estudiante.sede || ''
        this.nombreJornada = data.datos.nombreJornada || this.estudiante.jornada || ''
        this.directorCurso = data.datos.directorCurso || ''
        this.puesto = data.datos.puesto
        this.totalEstudiantes = data.datos.totalEstudiantes

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
      const asig = est.areas?.[area]?.asignaturas?.[asignatura]
      if (asig?.orden === 98) return true
      return !!(asig && asig.periodos)
    },
    tieneNotasArea (est, area) {
      const asignaturas = Object.keys(est.areas?.[area]?.asignaturas || {})
      return asignaturas.some(asig => this.tieneNotasAsignatura(est, area, asig))
    },

    estructurarNotasPorEstudiante () {
      const mapa = {}
      this.misNotas.forEach(nota => {
        const {
          estudiante, documento, area, asignatura, periodo,
          definitiva, recuperacion, definitivacompor, fechaR, inclusion,
          observaciones, pd, C1, C2, C3, concep, conceptual, totalAJ, totalAS, totalAJTodos, totalASTodos
        } = nota
        if (!mapa[estudiante]) {
          mapa[estudiante] = { documento, ausJ: 0, ausS: 0, ausJTodos: 0, ausSTodos: 0, areas: {} }
        }
        const est = mapa[estudiante]
        if (!est.areas[area]) est.areas[area] = { asignaturas: {} }
        if (!est.areas[area].asignaturas[asignatura]) {
          const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
          est.areas[area].asignaturas[asignatura] = {
            intensidadHoraria: meta?.ih || 0,
            orden: meta?.orden || 0,
            porcentaje: meta?.porcentaje || 100,
            docente: meta?.docente || '',
            periodos: {},
            definitivas: {},
            recuperaciones: {},
            c1: {},
            c2: {},
            c3: {},
            definitiva: null,
            recuperacion: null,
            definitivacompor: null,
            fechaR: null,
            inclusion: null,
            observaciones: null,
            pd: null,
            concep: null,
            conceptual: null,
            ausJ: 0,
            ausS: 0,
            ausJTodos: 0,
            ausSTodos: 0
          }
        }
        const asig = est.areas[area].asignaturas[asignatura]
        if (asig.orden == 99 && this.tipoValComp == 0) {
          asig.periodos[periodo] = definitivacompor
          asig.definitivas[periodo] = definitivacompor
          asig.recuperaciones[periodo] = ''
          asig.definitiva = definitivacompor
          asig.recuperacion = ''
        } else {
          const definitivaNum = Number(definitiva)
          const recuperacionNum = Number(recuperacion)
          asig.periodos[periodo] = recuperacionNum > definitivaNum ? recuperacionNum : definitivaNum
          asig.definitivas[periodo] = definitivaNum
          asig.recuperaciones[periodo] = recuperacionNum
          asig.definitiva = definitivaNum
          asig.recuperacion = recuperacionNum
        }
        asig.c1[periodo] = Number(C1)
        asig.c2[periodo] = Number(C2)
        asig.c3[periodo] = Number(C3)
        asig.fechaR = fechaR
        asig.inclusion = inclusion
        asig.observaciones = observaciones
        asig.pd = pd
        asig.concep = concep
        asig.conceptual = conceptual
        asig.ausJ += Number(totalAJ) || 0
        asig.ausS += Number(totalAS) || 0
        asig.ausJTodos += Number(totalAJTodos) || 0
        asig.ausSTodos += Number(totalASTodos) || 0

        est.ausJ += Number(totalAJ) || 0
        est.ausS += Number(totalAS) || 0
        est.ausJTodos += Number(totalAJTodos) || 0
        est.ausSTodos += Number(totalASTodos) || 0
      })
      return mapa
    },

    redondear (num) {
      const m = Number((Math.abs(num) * 10).toPrecision(15))
      return Math.round(m) / 10 * Math.sign(num)
    },

    definitivaPeriodo (est, area, asignatura, periodo) {
      const concep = est.areas?.[area]?.asignaturas?.[asignatura]?.concep
      if (concep === 'S') return ''
      const orden = est.areas?.[area]?.asignaturas?.[asignatura]?.orden
      const nota = est.areas?.[area]?.asignaturas?.[asignatura]?.definitivas?.[periodo]
      if (orden == 99 && this.tipoValComp == 0) {
        const idx = this.letrasCompor.findIndex(l => l === nota)
        this.escala = idx >= 0 ? idx + 2 : 2
        return nota || ''
      }
      const n = Number(nota)
      return Number.isFinite(n) && n > 0 ? n.toFixed(1) : ''
    },
    recuperacion (est, area, asignatura, periodo) {
      const rec = est.areas?.[area]?.asignaturas?.[asignatura]?.recuperaciones?.[periodo]
      const n = Number(rec)
      return Number.isFinite(n) && n > 0 ? n.toFixed(1) : ''
    },
    criterio1Periodo (est, area, asignatura, periodo) {
      const asig = est.areas?.[area]?.asignaturas?.[asignatura]
      if (asig?.concep === 'S' || asig?.orden === 98) return ''
      const n = Number(asig?.c1?.[periodo])
      return Number.isFinite(n) && n > 0 ? n.toFixed(1) : ''
    },
    criterio2Periodo (est, area, asignatura, periodo) {
      const asig = est.areas?.[area]?.asignaturas?.[asignatura]
      if (asig?.concep === 'S' || asig?.orden === 98) return ''
      const n = Number(asig?.c2?.[periodo])
      return Number.isFinite(n) && n > 0 ? n.toFixed(1) : ''
    },
    criterio3Periodo (est, area, asignatura, periodo) {
      const asig = est.areas?.[area]?.asignaturas?.[asignatura]
      if (asig?.concep === 'S' || asig?.orden === 98) return ''
      const n = Number(asig?.c3?.[periodo])
      return Number.isFinite(n) && n > 0 ? n.toFixed(1) : ''
    },
    notaFinal (est, area, asignatura, periodo) {
      const orden = est.areas?.[area]?.asignaturas?.[asignatura]?.orden
      if (orden === 98) return ''
      const def = parseFloat(this.definitivaPeriodo(est, area, asignatura, periodo))
      const rec = parseFloat(this.recuperacion(est, area, asignatura, periodo))
      if (orden == 99 && this.tipoValComp == 0) return this.definitivaPeriodo(est, area, asignatura, periodo)
      if (isNaN(def) && isNaN(rec)) return ''
      if (!isNaN(rec) && rec > def) return rec.toFixed(1)
      return def > 0 ? def.toFixed(1) : def
    },
    promedioAsignatura (est, area, asignatura) {
      if (this.esConceptual) return ''
      const orden = est.areas?.[area]?.asignaturas?.[asignatura]?.orden
      const asig = est.areas?.[area]?.asignaturas?.[asignatura]
      if (!asig || orden === 98 || asig.concep === 'S') return ''
      let total = 0
      let cant = 0
      if (orden == 99 && this.tipoValComp == 0) {
        for (const p in asig.periodos) {
          const nota = asig.periodos[p]
          const idx = this.letrasCompor.findIndex(valor => valor === nota)
          if (idx === -1) continue
          total += Number(this.umbralesA[idx])
          cant++
        }
        const promedioLetras = cant > 0 ? this.redondear(total / cant).toFixed(1) : 0
        if (promedioLetras <= this.umbralesA[0]) return this.letrasCompor[0]
        else if (promedioLetras <= this.umbralesA[1]) return this.letrasCompor[1]
        else if (promedioLetras <= this.umbralesA[2]) return this.letrasCompor[2]
        else if (promedioLetras <= this.umbralesA[3]) return this.letrasCompor[3]
        else return promedioLetras
      } else {
        for (const p in asig.periodos) {
          const nota = Number(asig.periodos[p])
          if (Number.isFinite(nota) && nota > 0) { total += nota; cant++ }
        }
        return cant > 0 ? this.redondear(total / cant).toFixed(1) : ''
      }
    },
    promedioArea (est, area) {
      if (this.esConceptual) return ''
      const asigns = Object.keys(est.areas?.[area]?.asignaturas || {})
      if (!asigns.length) return ''
      const orden = est.areas?.[area]?.asignaturas?.[asigns]?.orden
      const asignatura = asigns.reduce((asig) => asig)
      if (orden == 99 && this.tipoValComp == 0) return this.promedioAsignatura(est, area, asignatura)
      const total = asigns.reduce((sum, asig) => {
        if (est.areas?.[area]?.asignaturas?.[asig]?.orden === 98) return sum
        return sum + parseFloat(this.promedioAsignatura(est, area, asig) * est.areas?.[area]?.asignaturas?.[asig]?.porcentaje / 100 || 0)
      }, 0)
      return total > 0 ? this.redondear(total).toFixed(1) : ''
    },
    promedioAreaPorPeriodo (est, area, periodo) {
      const asigns = Object.keys(est.areas?.[area]?.asignaturas || {})
      if (!asigns.length) return ''
      const concep = est.areas?.[area]?.asignaturas?.[asigns]?.concep
      if (concep === 'S') return ''
      const orden = est.areas?.[area]?.asignaturas?.[asigns]?.orden
      if (orden == 99 && this.tipoValComp == 0) return est.areas?.[area]?.asignaturas?.[asigns]?.periodos?.[periodo] || ''
      const total = asigns.reduce((sum, asig) => {
        if (est.areas?.[area]?.asignaturas?.[asig]?.orden === 98) return sum
        const nota = est.areas?.[area]?.asignaturas?.[asig]?.periodos?.[periodo] * est.areas?.[area]?.asignaturas?.[asig]?.porcentaje / 100
        return sum + (typeof nota === 'number' ? nota : 0)
      }, 0)
      return total > 0 ? this.redondear(total).toFixed(1) : ''
    },
    notaFinalArea (est, area) {
      const asigns = this.promCompor == 1
        ? this.listaAreasAsignaturas.filter(a => a.area === area && a.orden !== 98)
        : this.listaAreasAsignaturas.filter(a => a.area === area && a.orden !== 99 && a.orden !== 98)
      if (!asigns.length) return '*'
      let total = 0
      asigns.forEach(asigMeta => {
        const { asignatura, porcentaje, orden } = asigMeta
        if (orden === 99 && this.tipoValComp == 0) return
        const datos = est.areas?.[area]?.asignaturas?.[asignatura]
        if (!datos) return
        const notaFinal = this.notaFinal(est, area, asignatura, this.periodoActual)
        if (!isNaN(notaFinal) && notaFinal !== '') total += Number(notaFinal) * (porcentaje / 100)
      })
      return total > 0 ? this.redondear(total).toFixed(1) : ''
    },
    intensidadHorariaAsignatura (area, asignatura) {
      const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
      return meta?.ih || 0
    },
    intensidadHorariaArea (est, area) {
      const asigns = Object.keys(est.areas?.[area]?.asignaturas || {})
      return asigns.reduce((sum, asig) => sum + this.intensidadHorariaAsignatura(area, asig), 0)
    },
    notaPeriodo (est, area, asignatura, periodo) {
      const orden = est.areas?.[area]?.asignaturas?.[asignatura]?.orden
      if (orden === 98) return ''
      const concep = est.areas?.[area]?.asignaturas?.[asignatura]?.concep
      if (concep === 'S') return ''
      const valor = est.areas?.[area]?.asignaturas?.[asignatura]?.periodos?.[periodo]
      if (orden == 99 && this.tipoValComp == 0) return valor || ''
      const n = Number(valor)
      return Number.isFinite(n) && n !== 0 ? n.toFixed(1) : ''
    },
    ausencias (est, area, asignatura, tipo) {
      return Number(est.areas?.[area]?.asignaturas?.[asignatura]?.[tipo]) || 0
    },
    ausenciasArea (est, area, tipo) {
      const asigns = Object.keys(est.areas?.[area]?.asignaturas || {})
      return asigns.reduce((sum, asig) => sum + Number(this.ausencias(est, area, asig, tipo)), 0)
    },
    // Desempeño textual: comportamiento (letra configurada) o academico (umbral numerico)
    desempeno (nota, area, asignatura) {
      const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
      if (meta?.orden === 99) {
        const idx = this.letrasCompor.findIndex(l => l === nota)
        return idx >= 0 ? (this.labelsCompor[idx] || '') : ''
      }
      const tipo = meta?.idTipoEspecialidad || 1
      const valor = parseFloat(nota)
      if (isNaN(valor)) return ''
      const umbralBajo = tipo === 2 ? this.umbralesT[0] : this.umbralesA[0]
      const umbralBasico = tipo === 2 ? this.umbralesT[1] : this.umbralesA[1]
      const umbralAlto = tipo === 2 ? this.umbralesT[2] : this.umbralesA[2]
      const umbralSuperior = tipo === 2 ? this.umbralesT[3] : this.umbralesA[3]
      if (valor < umbralBajo) return 'Bajo'
      if (valor < umbralBasico) return 'Básico'
      if (valor < umbralAlto) return 'Alto'
      if (valor <= umbralSuperior) return 'Superior'
      return ''
    },
    descriptorAsignatura (est, area, asignatura, periodo, orden) {
      const datos = est.areas?.[area]?.asignaturas?.[asignatura]
      const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
      if (!datos || !meta) return ''
      if (orden !== 99 && (datos.pd === 'S' || datos.concep === 'S')) {
        let texto = ''
        if (datos.pd === 'S') texto += datos.inclusion != null ? datos.inclusion : ''
        if (datos.concep === 'S') texto += (texto ? ' - ' : '') + (datos.conceptual != null ? datos.conceptual : '')
        return texto
      }
      let notaFinal
      if (orden === 99 && this.tipoValComp == 0) {
        this.notaFinal(est, area, asignatura, periodo)
        notaFinal = this.escala
      } else {
        notaFinal = parseFloat(this.notaFinal(est, area, asignatura, periodo))
      }
      if (isNaN(notaFinal)) return ''
      const tipo = meta.idTipoEspecialidad
      const umbralBajo = tipo === 2 ? this.umbralesT[0] : this.umbralesA[0]
      const umbralBasico = tipo === 2 ? this.umbralesT[1] : this.umbralesA[1]
      const umbralAlto = tipo === 2 ? this.umbralesT[2] : this.umbralesA[2]
      const umbralSuperior = tipo === 2 ? this.umbralesT[3] : this.umbralesA[3]
      let conceptoValorativo = null
      if (notaFinal < umbralBajo) conceptoValorativo = 1
      else if (notaFinal < umbralBasico) conceptoValorativo = 2
      else if (notaFinal < umbralAlto) conceptoValorativo = 3
      else if (notaFinal <= umbralSuperior) conceptoValorativo = 4
      else conceptoValorativo = 999
      const descriptorObj = this.listaDescriptores.find(d => d.idAsignaturaCurso === meta.idAsignaturaCurso && d.id_concepto_valorativo === conceptoValorativo)
      return descriptorObj?.descriptor || ''
    },
    observacionComportamiento (est) {
      const compo = this.listaAreasAsignaturas.find(a => a.orden === 99)
      if (!compo) return ''
      const datos = est.areas?.[compo.area]?.asignaturas?.[compo.asignatura]
      return datos?.observaciones || ''
    },

    renderBoletin (data) {
      if (!data) return `<p>No hay datos para ${this.estudiante.estudiante}</p>`
      const encabezadoDesem = COL_DESEM === 7
        ? `<th>${this.config.nombreC1 || 'C1'}</th><th>${this.config.nombreC2 || 'C2'}</th><th>${this.config.nombreC3 || 'C3'}</th><th>Defin</th><th>Desemp</th><th>AJ</th><th>AS</th>`
        : `<th>Evalu</th><th>Recup</th><th>Defin</th><th>Desemp</th><th>AJ</th><th>AS</th>`
      return `
        <div class="boletin">
          <div class="text-center mt-2">
            <p style="text-align: center; font-size: 14px;">SECRETARÍA DE EDUCACIÓN TERRITORIAL DE TUNJA<br><b>${this.nombreInstitucion}</b><br>TUNJA - BOYACÁ<br>BOLETIN DE EVALUACIONES POR PERIODO</p>
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
                <th rowspan="2">Área / Asignatura</th>
                <th rowspan="2">IH</th>
                <th colspan="${this.periodosVisibles.length + 1}">Historial</th>
                <th colspan="${COL_DESEM}">Desempeño en el Periodo</th>
                <th colspan="2">Ausencias Totales</th>
              </tr>
              <tr>
                ${this.periodosVisibles.map(p => `<th>P${p}</th>`).join('')}
                <th>PR</th>
                ${encabezadoDesem}
                <th>TAJ</th>
                <th>TAS</th>
              </tr>
            </thead>
            <tbody>
              ${this.renderCuerpoTabla(data)}
            </tbody>
          </table>
          <table class="tabla-boletin">
            <thead>
              <tr>
                <th>Desempeños: BAJO [${this.fmtRango(this.config.minBaj)} - ${this.fmtRango(this.config.maxBaj)}] | BÁSICO [${this.fmtRango(this.config.minBas)} - ${this.fmtRango(this.config.maxBas)}] | ALTO [${this.fmtRango(this.config.minAlt)} - ${this.fmtRango(this.config.maxAlt)}] | SUPERIOR [${this.fmtRango(this.config.minSup)} - ${this.fmtRango(this.config.maxSup)}]</th>
              </tr>
            </thead>
          </table>
          <table class="tabla-boletin">
            <thead>
              <tr>
                <th colspan="2" style="width:50%; text-align: left">Promedio: <strong>${this.esConceptual ? '' : this.calcularPromedioGeneral(data)}</strong></th>
                <th colspan="2" style="width:50%; text-align: left">Puesto: <strong>${this.esConceptual ? '' : ((this.puesto || '-') + ' de ' + (this.totalEstudiantes || '-'))}</strong></th>
              </tr>
              <tr>
                <th style="width:25%; text-align: left">Aus. Justificadas Periodo: <strong>${data.ausJ}</strong></th>
                <th style="width:25%; text-align: left">Aus. Sin Justificar Periodo: <strong>${data.ausS}</strong></th>
                <th style="width:25%; text-align: left">Aus. Justificadas Total: <strong>${data.ausJTodos}</strong></th>
                <th style="width:25%; text-align: left">Aus. Sin Justificar Total: <strong>${data.ausSTodos}</strong></th>
              </tr>
            </thead>
          </table>
          <table class="tabla-boletin observacion-comportamiento">
            <thead>
              <tr>
                <th style="text-align: left; height:100px; padding-left: 10px; vertical-align: top;"><h3>🧠 Observaciones:</h3>${this.observacionComportamiento(data)}</th>
              </tr>
            </thead>
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
    fmtRango (v) {
      const n = Number(v)
      return Number.isFinite(n) ? n.toFixed(1) : '-'
    },
    calcularPromedioGeneral (data) {
      const areasEvaluativas = this.promCompor == 1
        ? [...new Set(this.listaAreasAsignaturas.filter(a => a.orden !== 98).map(a => a.area))]
        : [...new Set(this.listaAreasAsignaturas.filter(a => a.orden !== 99 && a.orden !== 98).map(a => a.area))]
      let total = 0
      let cantidad = 0
      areasEvaluativas.forEach(area => {
        const notaFinalArea = parseFloat(this.notaFinalArea(data, area))
        if (!isNaN(notaFinalArea)) { total += notaFinalArea; cantidad++ }
      })
      return cantidad > 0 ? (total / cantidad).toFixed(3) : '0.000'
    },
    renderCuerpoTabla (data) {
      const areas = [...new Set(this.listaAreasAsignaturas.map(a => a.area))]
        .filter(area => this.tieneNotasArea(data, area))
      return areas.map(area => {
        const asigns = this.listaAreasAsignaturas.filter(a => a.area === area && this.tieneNotasAsignatura(data, area, a.asignatura))
        const filasAsignaturas = asigns.map(asig => {
          const a = asig.asignatura
          const orden = data.areas?.[area]?.asignaturas?.[a]?.orden
          const esSoloDescriptor = orden === 98
          const nombreAsignatura = asig.nombreAsignatura
          const notas = this.periodosVisibles.map(p => `<td>${esSoloDescriptor ? '' : this.notaPeriodo(data, area, a, p)}</td>`).join('')
          const prom = this.promedioAsignatura(data, area, a)
          const final = this.notaFinal(data, area, a, this.periodoActual)
          const des = esSoloDescriptor ? '' : this.desempeno(final, area, a)
          const ausJ = this.ausencias(data, area, a, 'ausJ')
          const ausS = this.ausencias(data, area, a, 'ausS')
          const tAJ = this.ausencias(data, area, a, 'ausJTodos')
          const tAS = this.ausencias(data, area, a, 'ausSTodos')
          const docente = asig.docente != null ? asig.docente : ''
          const celdasDesem = COL_DESEM === 7
            ? `<td>${this.criterio1Periodo(data, area, a, this.periodoActual)}</td><td>${this.criterio2Periodo(data, area, a, this.periodoActual)}</td><td>${this.criterio3Periodo(data, area, a, this.periodoActual)}</td>`
            : `<td>${esSoloDescriptor ? '' : this.definitivaPeriodo(data, area, a, this.periodoActual)}</td><td>${esSoloDescriptor ? '' : this.recuperacion(data, area, a, this.periodoActual)}</td>`

          return `
            <tr>
              <td style="text-align: left"><strong>${nombreAsignatura}</strong> <br> <i style="font-size: 10px;">${docente}</i></td>
              <td>${esSoloDescriptor ? '' : asig.ih}</td>
              ${notas}
              <td>${prom == null ? '' : prom}</td>
              ${celdasDesem}
              <td>${final == null ? '' : final}</td>
              <td>${des == null ? '' : des}</td>
              <td>${esSoloDescriptor ? '' : (ausJ > 0 ? ausJ : '')}</td>
              <td>${esSoloDescriptor ? '' : (ausS > 0 ? ausS : '')}</td>
              <td>${esSoloDescriptor ? '' : (tAJ > 0 ? tAJ : '')}</td>
              <td>${esSoloDescriptor ? '' : (tAS > 0 ? tAS : '')}</td>
            </tr>
            <tr><td colspan="${this.periodosVisibles.length + 1 + COL_DESEM + 4}" class="descriptor" style="text-align: left">${this.descriptorAsignatura(data, area, a, this.periodoActual, orden)}</td></tr>
          `
        }).join('')

        const notasArea = this.periodosVisibles.map(p => `<td>${this.promedioAreaPorPeriodo(data, area, p)}</td>`).join('')
        const promArea = this.promedioArea(data, area)
        const finalArea = this.notaFinalArea(data, area)
        const desArea = this.desempeno(finalArea, area, asigns[0]?.asignatura)
        const ausJArea = this.ausenciasArea(data, area, 'ausJ')
        const ausSArea = this.ausenciasArea(data, area, 'ausS')
        const tAJArea = this.ausenciasArea(data, area, 'ausJTodos')
        const tASArea = this.ausenciasArea(data, area, 'ausSTodos')
        const ihArea = this.intensidadHorariaArea(data, area)
        const vaciasDesem = COL_DESEM === 7 ? '<td></td><td></td><td></td>' : '<td></td><td></td>'

        return `
          <tr class="fila-area">
            <td style="text-align: left"><strong>${this.nombreDelArea(area)}</strong></td>
            <td>${ihArea}</td>
            ${notasArea}
            <td>${promArea}</td>
            ${vaciasDesem}
            <td>${finalArea}</td>
            <td>${desArea}</td>
            <td>${ausJArea > 0 ? ausJArea : ''}</td>
            <td>${ausSArea > 0 ? ausSArea : ''}</td>
            <td>${tAJArea > 0 ? tAJArea : ''}</td>
            <td>${tASArea > 0 ? tASArea : ''}</td>
          </tr>
          ${filasAsignaturas}
        `
      }).join('')
    },
    estilosBoletin () {
      return `
        body { font-family: Arial, sans-serif; margin: 5px; }
        .boletin { page-break-after: always; }
        .tabla-boletin { width: 100%; border-collapse: collapse; font-size: 0.7rem; margin-top: 0.5rem; }
        .tabla-boletin th, .tabla-boletin td { border: 1px solid #ccc; padding: 1px 1px; text-align: center; }
        .fila-area { background-color: #f0f0f0; font-weight: bold; }
        .descriptor { font-style: italic; background-color: #f9f9f9; text-align: left; }
        .firmas { margin-top: 5rem; font-size: 0.8rem; }
        .observacion-comportamiento {
          margin-top: 0.5rem;
          background-color: #f3f3f3;
          border-left: 4px solid #888;
          font-style: italic;
        }
      `
    }
  }
}
</script>
