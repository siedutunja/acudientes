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

// Portado de academico/src/views/reportes/boletines/BoletinPree.vue - boletin de preescolar,
// unico para todos los colegios en academico (a diferencia del boletin de primaria/secundaria).
// Aqui se generaliza via `config` (fila de secciones_ie) en vez de "if institucion==X" como en el original:
// la escala de letras (preeL1-4/preeC1-4) y el comportamiento (compL1-4/compC1-4) salen de la config del colegio.
export default {
  name: 'BoletinPree',
  props: {
    idMatricula: { type: String, required: true },
    idCurso: { type: String, required: true },
    vigencia: { type: [String, Number], required: true },
    periodosVisibles: { type: Array, required: true }, // ej. [1] o [1,2,3,4]
    estudiante: { type: Object, required: true },
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
      directorCurso: ''
    }
  },
  computed: {
    periodoActual () {
      return this.periodosVisibles[this.periodosVisibles.length - 1]
    },
    tipoValComp () {
      return this.config.tipoValComp != null ? Number(this.config.tipoValComp) : 1
    },
    // Letras/etiquetas de comportamiento configuradas por el colegio (secciones_ie), en orden BAJO->SUPERIOR
    letrasCompor () {
      const c = this.config
      return [c.compL1, c.compL2, c.compL3, c.compL4]
    },
    labelsCompor () {
      const c = this.config
      return [c.compC1, c.compC2, c.compC3, c.compC4]
    },
    // Escala de preescolar (letra + umbral numerico + texto) configurada por el colegio, orden BAJO->SUPERIOR
    escalaPreescolar () {
      const c = this.config
      return [
        { letra: c.preeL1, umbral: Number(c.minBaj), texto: c.preeC1 },
        { letra: c.preeL2, umbral: Number(c.minBas), texto: c.preeC2 },
        { letra: c.preeL3, umbral: Number(c.minAlt), texto: c.preeC3 },
        { letra: c.preeL4, umbral: Number(c.maxSup), texto: c.preeC4 }
      ]
    },
    emojiPorIndice () {
      return ['😞', '🙂', '😊', '😄']
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
        this.listaDescriptores = data.datos.listaDescriptores || []
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

    // Letra efectiva de un periodo: definitivapree si existe, si no se intenta con el texto de "concepto"
    // (algunos colegios no guardan definitivapree y solo dejan el concepto en texto libre - ver notas view)
    letraPeriodo (nota) {
      const letra = String(nota.definitivapree || '').trim().toUpperCase()
      if (letra && letra !== '0') return letra
      const texto = String(nota.concepto || '').trim().toUpperCase()
      if (!texto) return ''
      const item = this.escalaPreescolar.find(e => String(e.texto || '').trim().toUpperCase() === texto)
      return item ? item.letra : ''
    },
    // Valor numerico ancla de una letra de comportamiento (indice 1-4 segun el orden configurado por el colegio)
    valorComportamiento (letra) {
      const idx = this.letrasCompor.findIndex(l => l === letra)
      return idx >= 0 ? idx + 1 : null
    },
    labelComportamiento (letra) {
      const idx = this.letrasCompor.findIndex(l => l === letra)
      return idx >= 0 ? (this.labelsCompor[idx] || '') : ''
    },
    // Valor numerico ancla de una letra academica de preescolar, segun los umbrales configurados por el colegio
    valorPreescolar (letra) {
      const item = this.escalaPreescolar.find(e => e.letra === letra)
      return item ? item.umbral : null
    },
    conceptoDesdeValorPreescolar (valor) {
      for (let i = 0; i < this.escalaPreescolar.length; i++) {
        const actual = this.escalaPreescolar[i]
        const siguiente = this.escalaPreescolar[i + 1]
        if (!siguiente || valor < siguiente.umbral) return { idx: i, letra: actual.letra, texto: actual.texto }
      }
      return null
    },

    estructurarNotasPorEstudiante () {
      const mapa = {}
      this.misNotas.forEach(nota => {
        const { estudiante, documento, area, asignatura, periodo, pd, inclusion, observaciones, concep, conceptual, totalAJ, totalAS } = nota
        if (!mapa[estudiante]) mapa[estudiante] = { documento, ausJ: 0, ausS: 0, areas: {} }
        const est = mapa[estudiante]
        if (!est.areas[area]) est.areas[area] = { asignaturas: {} }
        if (!est.areas[area].asignaturas[asignatura]) {
          const meta = this.listaAreasAsignaturas.find(a => a.area === area && a.asignatura === asignatura)
          est.areas[area].asignaturas[asignatura] = {
            intensidadHoraria: meta?.ih || 0,
            orden: meta?.orden || 0,
            docente: meta?.docente || '',
            periodos: {},
            pd: null,
            inclusion: null,
            observaciones: null,
            concep: null,
            conceptual: null,
            ausJ: 0,
            ausS: 0
          }
        }
        const asig = est.areas[area].asignaturas[asignatura]
        const letra = asig.orden === 99 ? String(nota.definitivacompor || '').trim().toUpperCase() : this.letraPeriodo(nota)
        asig.periodos[periodo] = letra
        asig.pd = pd
        asig.inclusion = inclusion
        asig.observaciones = observaciones
        asig.concep = concep
        asig.conceptual = conceptual
        asig.ausJ += Number(totalAJ) || 0
        asig.ausS += Number(totalAS) || 0

        est.ausJ += Number(totalAJ) || 0
        est.ausS += Number(totalAS) || 0
      })
      return mapa
    },

    tieneNotasArea (est, area) {
      const asignaturas = Object.keys(est.areas?.[area]?.asignaturas || {})
      return asignaturas.some(a => !!est.areas[area].asignaturas[a])
    },

    // Promedio del periodo actual mostrado como letra (comportamiento o academico)
    promedioAsignatura (asig) {
      if (asig.orden === 98) return ''
      const valores = Object.values(asig.periodos)
        .map(letra => asig.orden === 99 ? this.valorComportamiento(letra) : this.valorPreescolar(letra))
        .filter(v => v !== null && v !== undefined)
      if (!valores.length) return ''
      const prom = valores.reduce((a, b) => a + b, 0) / valores.length
      const concepto = asig.orden === 99
        ? (this.letrasCompor[Math.max(0, Math.round(prom) - 1)] || '')
        : (this.conceptoDesdeValorPreescolar(prom)?.letra || '')
      return concepto
    },
    desempeno (letra, orden) {
      if (!letra) return { emoji: '', texto: '' }
      if (orden === 99) return { emoji: '', texto: this.labelComportamiento(letra) }
      const idx = this.escalaPreescolar.findIndex(e => e.letra === letra)
      if (idx === -1) return { emoji: '', texto: '' }
      return { emoji: this.emojiPorIndice[idx] || '', texto: this.escalaPreescolar[idx].texto || '' }
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
      const letra = datos.periodos?.[periodo] || ''
      if (!letra) return ''
      const idx = orden === 99 ? this.letrasCompor.indexOf(letra) : this.escalaPreescolar.findIndex(e => e.letra === letra)
      if (idx === -1) return ''
      const descriptorObj = this.listaDescriptores.find(d => d.idAsignaturaCurso === meta.idAsignaturaCurso && d.id_concepto_valorativo === idx + 1)
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
          ${this.renderCuerpo(data)}
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
    renderCuerpo (data) {
      const periodos = this.periodosVisibles
      const areas = [...new Set(this.listaAreasAsignaturas.map(a => a.area))].filter(area => this.tieneNotasArea(data, area))
      let html = `
        <table class="tabla-boletin">
          <thead>
            <tr>
              <th rowspan="2">Área / Asignatura</th>
              <th rowspan="2">IH</th>
              <th colspan="${periodos.length + 1}">Historial</th>
              <th colspan="4">Desempeño en el Periodo</th>
            </tr>
            <tr>
              ${periodos.map(p => `<th>P${p}</th>`).join('')}
              <th>Prom</th>
              <th>EvalPer</th>
              <th>Desempeño</th>
              <th>AJ</th>
              <th>AS</th>
            </tr>
          </thead>
          <tbody>
      `
      areas.forEach(area => {
        const asigns = this.listaAreasAsignaturas.filter(a => a.area === area && data.areas?.[area]?.asignaturas?.[a.asignatura])
        html += `
          <tr class="fila-area">
            <td style="text-align: left"><strong>${this.nombreDelArea(area)}</strong></td>
            <td colspan="${periodos.length + 6}"></td>
          </tr>
        `
        asigns.forEach(({ asignatura, ih, nombreAsignatura, docente }) => {
          const asig = data.areas[area].asignaturas[asignatura]
          const orden = asig.orden
          const esSoloDescriptor = orden === 98
          const notaActual = asig.periodos?.[this.periodoActual] || ''
          const promedio = esSoloDescriptor ? '' : this.promedioAsignatura(asig)
          const desem = esSoloDescriptor ? { emoji: '', texto: '' } : this.desempeno(notaActual, orden)
          html += `
            <tr>
              <td style="text-align: left"><strong>${nombreAsignatura}</strong> <br> <i style="font-size: 10px;">${docente}</i></td>
              <td>${esSoloDescriptor ? '' : ih}</td>
              ${periodos.map(p => `<td>${esSoloDescriptor ? '' : (asig.periodos?.[p] || '')}</td>`).join('')}
              <td>${promedio}</td>
              <td>${esSoloDescriptor ? '' : notaActual}</td>
              <td>${esSoloDescriptor ? '' : (desem.emoji + ' ' + desem.texto).trim()}</td>
              <td>${esSoloDescriptor ? '' : (asig.ausJ || 0)}</td>
              <td>${esSoloDescriptor ? '' : (asig.ausS || 0)}</td>
            </tr>
            <tr><td colspan="${periodos.length + 7}" class="descriptor" style="text-align: left">${this.descriptorAsignatura(data, area, asignatura, this.periodoActual, orden)}</td></tr>
          `
        })
      })
      html += `
          </tbody>
        </table>
        <table class="tabla-boletin">
          <thead>
            <tr>
              <th style="width:50%; text-align: left">Aus.Justificadas: <strong>${data.ausJ}</strong></th>
              <th style="width:50%; text-align: left">Aus.SinJustificar: <strong>${data.ausS}</strong></th>
            </tr>
          </thead>
        </table>
      `
      return html
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
