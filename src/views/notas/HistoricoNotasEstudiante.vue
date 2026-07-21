<template>
  <div class="p-2 p-md-3">
    <div class="mb-3">
      <b-button variant="outline-primary" @click="volverAMenuEstudiante">
        Regresar al menú del estudiante
      </b-button>
    </div>

    <section class="notas-page">
      <article class="card summary-card">
        <div class="student-photo-wrap">
          <img v-if="studentSummary.foto" :src="studentSummary.foto" alt="Foto estudiante" class="student-photo">
          <div v-else class="student-photo placeholder-photo">Sin foto</div>
        </div>

        <div class="student-content">
          <h2 class="student-name">{{ studentSummary.nombre || '-' }}</h2>
          <p class="student-doc">{{ studentSummary.tipodocumento || '-' }} {{ studentSummary.documento || '-' }}</p>

          <div class="student-grid">
            <div class="item"><span>Sede</span><strong>{{ studentSummary.sede || '-' }}</strong></div>
            <div class="item"><span>Grado</span><strong>{{ studentSummary.grado || '-' }}</strong></div>
            <div class="item"><span>Curso</span><strong>{{ studentSummary.curso || '-' }}</strong></div>
            <div class="item"><span>Jornada</span><strong>{{ studentSummary.jornada || '-' }}</strong></div>
            <div class="item"><span>Especialidad</span><strong>{{ studentSummary.especialidad || '-' }}</strong></div>
            <div class="item"><span>Vigencia</span><strong>{{ studentSummary.vigencia || '-' }}</strong></div>
          </div>
        </div>
      </article>

      <article class="card filters-card">
        <h3>Historico academico</h3>
        <div class="filters-grid">
          <div class="field">
            <label>Periodo</label>
            <select v-model="filters.periodo">
              <option value="">Todos</option>
              <option v-for="p in periodOptions" :key="p" :value="String(p)">{{ p }}</option>
            </select>
          </div>

          <div class="field">
            <label>Area</label>
            <select v-model="filters.area">
              <option value="">Todas</option>
              <option v-for="a in areaOptions" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>

          <div class="field">
            <label>Asignatura</label>
            <select v-model="filters.asignatura">
              <option value="">Todas</option>
              <option v-for="a in subjectOptions" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>

          <div class="field search-field">
            <label>Buscador general</label>
            <input v-model.trim="filters.search" type="text" placeholder="Area, asignatura, observaciones...">
          </div>

          <div class="field">
            <label>Orden definitiva</label>
            <select v-model="filters.ordenDefinitiva">
              <option value="">Sin orden</option>
              <option value="desc">Mayor a menor</option>
              <option value="asc">Menor a mayor</option>
            </select>
          </div>
        </div>
      </article>

      <article class="card table-card">
        <div v-if="loading" class="state-block">Cargando notas...</div>
        <div v-else-if="!filteredRows.length" class="state-block empty">
          <h4>Sin registros</h4>
          <p>No hay notas para los filtros seleccionados.</p>
        </div>

        <div v-else class="table-wrap">
          <vue-good-table
            :columns="columns"
            :rows="filteredRows"
            style-class="vgt-table condensed bordered"
            :pagination-options="{ enabled: true, perPage: 12, mode: 'records', nextLabel: 'Siguiente', prevLabel: 'Anterior', rowsPerPageLabel: 'Filas por pagina' }"
            :sort-options="{ enabled: true }"
          >
            <template slot="table-row" slot-scope="props">
              <span v-if="props.column.field === 'definitiva' || props.column.field === 'definitivapree'">
                <span :class="['badge', scoreClass(props.row[props.column.field])]">{{ asScore(props.row[props.column.field]) }}</span>
              </span>
              <span v-else-if="props.column.field === 'areaDisplay'" class="text-wrap-cell">
                {{ props.row.nombreArea || props.row.nemoArea || '-' }}
              </span>
              <span v-else-if="props.column.field === 'asignaturaDisplay'" class="text-wrap-cell">
                {{ props.row.nombreAsignatura || props.row.nemo || '-' }}
              </span>
              <span v-else-if="props.column.field === 'defC1' || props.column.field === 'defC2' || props.column.field === 'defC3'">
                <span :class="['badge', scoreClass(props.row[props.column.field])]">{{ asScore(props.row[props.column.field]) }}</span>
              </span>
              <span v-else-if="props.column.field === 'concepto'">
                <span :class="['badge', conceptoClass(props.row.concepto)]">{{ props.row.concepto || '—' }}</span>
              </span>
              <span v-else-if="props.column.field === 'fecha_recupera'">{{ asDate(props.row.fecha_recupera) }}</span>
              <span v-else-if="props.column.field === 'observaciones'" class="text-wrap-cell">{{ props.row.observaciones || '-' }}</span>
              <span v-else>{{ props.formattedRow[props.column.field] }}</span>
            </template>
          </vue-good-table>
        </div>
      </article>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import { VueGoodTable } from 'vue-good-table'
import 'vue-good-table/dist/vue-good-table.css'
import * as CONFIG from '@/assets/config.js'

export default {
  name: 'HistoricoNotasEstudiante',
  components: {
    VueGoodTable
  },
  data () {
    return {
      loading: false,
      rows: [],
      studentSummary: {},
      config: null,
      filters: {
        periodo: '',
        area: '',
        asignatura: '',
        search: '',
        ordenDefinitiva: ''
      }
    }
  },
  computed: {
    esPreeescolar () {
      return Number(this.studentSummary.nivelGrado) === 1
    },
    columns () {
      const base = [
        { label: 'P', field: 'periodo', width: '50px', thClass: 'text-center', tdClass: 'text-center', type: 'number' },
        { label: 'Área', field: 'areaDisplay', sortable: true, thClass: 'text-center', tdClass: 'text-left' },
        { label: 'Asignatura', field: 'asignaturaDisplay', sortable: true, thClass: 'text-center', tdClass: 'text-left' }
      ]
      if (this.esPreeescolar) {
        base.push({ label: 'Definitiva', field: 'definitivapree', width: '90px', thClass: 'text-center', tdClass: 'text-center' })
      } else {
        if (this.config && this.config.estadoC1) {
          base.push({ label: `${this.config.nombreC1} ${this.config.porcentajeC1}%`, field: 'defC1', width: '110px', thClass: 'text-center', tdClass: 'text-center', type: 'number' })
        }
        if (this.config && this.config.estadoC2) {
          base.push({ label: `${this.config.nombreC2} ${this.config.porcentajeC2}%`, field: 'defC2', width: '115px', thClass: 'text-center', tdClass: 'text-center', type: 'number' })
        }
        if (this.config && this.config.estadoC3) {
          base.push({ label: `${this.config.nombreC3} ${this.config.porcentajeC3}%`, field: 'defC3', width: '115px', thClass: 'text-center', tdClass: 'text-center', type: 'number' })
        }
        base.push(
          { label: 'Definitiva', field: 'definitiva', width: '90px', thClass: 'text-center', tdClass: 'text-center', type: 'number' },
          { label: 'Concepto', field: 'concepto', width: '90px', thClass: 'text-center', tdClass: 'text-center' },
          { label: 'Recupera', field: 'recuperacion', width: '80px', thClass: 'text-center', tdClass: 'text-center', type: 'number' }
        )
      }
      base.push(
        { label: 'Compor.', field: 'definitivacompor', width: '75px', thClass: 'text-center', tdClass: 'text-center' },
        { label: 'AusJ', field: 'ausJ', width: '55px', thClass: 'text-center', tdClass: 'text-center' },
        { label: 'AusS', field: 'ausS', width: '55px', thClass: 'text-center', tdClass: 'text-center' },
        { label: 'Inclusión', field: 'inclusion', width: '70px', thClass: 'text-center', tdClass: 'text-center' },
        { label: 'Observaciones', field: 'observaciones', thClass: 'text-center', tdClass: 'text-left' }
      )
      return base
    },
    periodOptions () {
      return [...new Set(this.rows.map(r => r.periodo).filter(Boolean))].sort((a, b) => Number(a) - Number(b))
    },
    areaOptions () {
      return [...new Set(this.rows.map(r => r.nombreArea || r.nemoArea).filter(Boolean))].sort()
    },
    subjectOptions () {
      return [...new Set(this.rows.map(r => r.nombreAsignatura || r.nemo).filter(Boolean))].sort()
    },
    filteredRows () {
      const txt = (this.filters.search || '').toLowerCase()
      let list = this.rows.filter((r) => {
        const okPeriodo = !this.filters.periodo || String(r.periodo || '') === String(this.filters.periodo)
        const areaVal = r.nombreArea || r.nemoArea || ''
        const asigVal = r.nombreAsignatura || r.nemo || ''
        const okArea = !this.filters.area || areaVal === this.filters.area
        const okAsig = !this.filters.asignatura || asigVal === this.filters.asignatura

        const fullText = [
          r.nemoArea,
          r.nombreArea,
          r.nemo,
          r.nombreAsignatura,
          r.definitivacompor,
          r.observaciones,
          r.inclusion
        ].filter(Boolean).join(' ').toLowerCase()

        const okText = !txt || fullText.includes(txt)
        return okPeriodo && okArea && okAsig && okText
      })

      if (this.filters.ordenDefinitiva) {
        const dir = this.filters.ordenDefinitiva === 'asc' ? 1 : -1
        list = [...list].sort((a, b) => (Number(a.definitiva || 0) - Number(b.definitiva || 0)) * dir)
      }

      return list
    }
  },
  methods: {
    asScore (v) {
      if (v === null || v === undefined || v === '') return '-'
      const n = Number(v)
      return Number.isNaN(n) ? String(v) : n.toFixed(1)
    },
    asDate (v) {
      if (!v) return '-'
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return String(v)
      return d.toLocaleDateString('es-CO')
    },
    scoreClass (v) {
      if (v === null || v === undefined || v === '' || v === 0 || v === '0') return 'badge-mid'
      // Letras preescolar: A/S = aprobado (verde), B = básico (azul), D = bajo (rojo)
      const letra = String(v).trim().toUpperCase()
      if (letra === 'A' || letra === 'S') return 'badge-high'
      if (letra === 'B') return 'badge-mid'
      if (letra === 'D') return 'badge-low'
      // Numérico
      const n = Number(v)
      if (Number.isNaN(n)) return 'badge-mid'
      if (n < 3.0) return 'badge-low'
      if (n < 4.0) return 'badge-mid'
      return 'badge-high'
    },
    async cargarConfig (idInstitucion, vigencia) {
      if (!idInstitucion) return
      try {
        const resp = await axios.get(CONFIG.ROOT_PATH + 'acudientes/config-evaluacion', {
          params: { idInstitucion, vigencia }
        })
        if (!resp.data.error && resp.data.datos) this.config = resp.data.datos
      } catch (e) { /* config no crítico */ }
    },
    conceptoClass (concepto) {
      if (!concepto) return 'badge-mid'
      const c = String(concepto).toUpperCase().trim()
      if (c === 'SUPERIOR') return 'badge-high'
      if (c === 'ALTO') return 'badge-blue'
      if (c === 'BASICO' || c === 'BÁSICO') return 'badge-mid'
      if (c === 'BAJO') return 'badge-low'
      return 'badge-mid'
    },
    volverAMenuEstudiante () {
      const idMatricula = this.$route.params.idMatricula
      this.$router.push({
        name: 'menu-estudiante',
        params: { idMatricula: String(idMatricula || '') },
        query: { doc: this.$route.query.doc || '' }
      })
    },
    construirResumen (estudiante, vigencia) {
      return {
        foto: estudiante.foto || '',
        nombre: estudiante.estudiante || '',
        documento: estudiante.documento || '',
        tipodocumento: estudiante.tipodocumento || '',
        sede: estudiante.sede || '',
        grado: estudiante.grado || '',
        curso: estudiante.curso || '',
        jornada: estudiante.jornada || '',
        especialidad: estudiante.especialidad || '',
        vigencia,
        nivelGrado: estudiante.nivelGrado || 0
      }
    },
    adaptarFilas (rowsApi) {
      const rows = []
      ;(rowsApi || []).forEach((r, idx) => {
        rows.push({
          __key: `${r.idAsignaturaCurso || 'sin-id'}-${r.periodo || ''}-${idx}`,
          periodo: r.periodo,
          nemoArea: r.nemoArea || '',
          nombreArea: r.nombreArea || '',
          nemo: r.nemo || '',
          nombreAsignatura: r.nombreAsignatura || '',
          defC1: r.defC1,
          defC2: r.defC2,
          defC3: r.defC3,
          definitiva: r.definitiva,
          recuperacion: r.recuperacion,
          definitivacompor: r.definitivacompor,
          concepto: r.concepto,
          definitivapree: r.definitivapree,
          ausJ: r.ausJ,
          ausS: r.ausS,
          observaciones: r.observaciones || '-',
          inclusion: r.inclusion,
          fecha_recupera: r.fecha_recupera,
          tipoAsignatura: r.tipoAsignatura || 1
        })
      })

      return rows.sort((a, b) => {
        const ao = Number(a.periodo) || 99
        const bo = Number(b.periodo) || 99
        if (ao !== bo) return ao - bo
        const areaA = `${a.nemoArea || ''}${a.nombreArea || ''}`
        const areaB = `${b.nemoArea || ''}${b.nombreArea || ''}`
        if (areaA !== areaB) return areaA.localeCompare(areaB)
        const asigA = `${a.nemo || ''}${a.nombreAsignatura || ''}`
        const asigB = `${b.nemo || ''}${b.nombreAsignatura || ''}`
        return asigA.localeCompare(asigB)
      })
    },
    async cargarHistoricoNotas (estudianteSeleccionado) {
      const idMatricula = this.$route.params.idMatricula || estudianteSeleccionado.idMatricula
      const vigencia = Number(sessionStorage.getItem('acudienteVigencia') || new Date().getFullYear())

      if (!idMatricula) {
        this.rows = []
        return
      }

      this.loading = true
      try {
        const notasRes = await axios.get(CONFIG.ROOT_PATH + 'acudientes/historico-notas/estudiante', {
          params: {
            idMatricula,
            periodo: 5,
            vigencia
          },
          timeout: 20000
        })

        const rowsApi = notasRes.data && !notasRes.data.error && notasRes.data.datos !== 0 ? notasRes.data.datos : []
        this.rows = this.adaptarFilas(rowsApi)
      } catch (err) {
        this.$bvToast.toast('Error consultando histórico de notas del estudiante.', {
          title: CONFIG.TITULO_MSG,
          variant: 'danger',
          toaster: 'b-toaster-top-center',
          solid: true,
          autoHideDelay: 3200,
          appendToast: false
        })
        this.rows = []
      } finally {
        this.loading = false
      }
    }
  },
  beforeMount () {
    const estudiantes = JSON.parse(sessionStorage.getItem('acudienteEstudiantes') || '[]')
    const idMatricula = this.$route.params.idMatricula
    const doc = this.$route.query.doc
    const vigencia = sessionStorage.getItem('acudienteVigencia') || ''

    const estudianteSeleccionado = estudiantes.find(x => String(x.idMatricula) === String(idMatricula)) ||
      estudiantes.find(x => String(x.documento) === String(doc || '')) || null

    if (!estudianteSeleccionado) {
      this.$bvToast.toast('Debes seleccionar primero un estudiante para ingresar a notas.', {
        title: 'Módulo Acudiente',
        variant: 'warning',
        toaster: 'b-toaster-top-center',
        solid: true,
        autoHideDelay: 2800,
        appendToast: false
      })
      this.$router.replace({ name: 'inicio-acudiente' })
      return
    }

    this.studentSummary = this.construirResumen(estudianteSeleccionado, vigencia)
    const idInstitucion = sessionStorage.getItem('acudienteIdInstitucion') || ''
    this.cargarConfig(String(idInstitucion), String(vigencia))
    this.cargarHistoricoNotas(estudianteSeleccionado)
  }
}
</script>

<style scoped>
.notas-page { background: #f3f6fa; min-height: 100%; color: #24313f; }
.card { background: #fff; border-radius: 14px; box-shadow: 0 8px 20px rgba(0, 30, 70, 0.08); margin-bottom: 1rem; }
.summary-card { display: grid; grid-template-columns: 110px 1fr; gap: 1rem; padding: 1rem; }
.student-photo-wrap { display: flex; align-items: center; justify-content: center; }
.student-photo { width: 86px; height: 86px; border-radius: 50%; object-fit: cover; border: 3px solid #d4e1ef; }
.placeholder-photo { width: 86px; height: 86px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e8eef5; color: #6b7a8a; }
.student-name { margin: 0; color: #1e4f8f; font-size: 1.2rem; }
.student-doc { margin: 0.2rem 0 0.8rem; color: #65788b; }
.student-grid { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 0.75rem; }
.item span { display: block; font-size: 0.74rem; color: #7b8a99; }
.item strong { font-size: 0.9rem; }
.filters-card { padding: 1rem; }
.filters-card h3 { margin: 0 0 0.9rem; color: #1e4f8f; font-size: 1.05rem; }
.filters-grid { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 0.7rem; }
.field label { display: block; font-size: 0.76rem; color: #6d7d8e; margin-bottom: 0.2rem; }
.field select, .field input { width: 100%; border: 1px solid #d5dfeb; border-radius: 8px; padding: 0.5rem 0.65rem; }
.search-field { grid-column: span 2; }
.table-card { padding: 1rem; }
.table-wrap { overflow: auto; border: 1px solid #e6edf5; border-radius: 12px; }
.text-wrap-cell { white-space: normal; line-height: 1.3; display: inline-block; min-width: 180px; }
.badge { border-radius: 999px; padding: 0.16rem 0.5rem; font-weight: 700; font-size: 0.75rem; display: inline-block; }
.badge-low { background: rgba(202, 44, 44, 0.15); color: #a82828; }
.badge-mid { background: rgba(219, 169, 19, 0.2); color: #8f6b05; }
.badge-high { background: rgba(33, 153, 77, 0.18); color: #1f7f44; }
.badge-blue { background: rgba(20, 90, 200, 0.15); color: #1452a5; }
.state-block { text-align: center; color: #617486; padding: 2rem 1rem; }
.state-block.empty h4 { margin: 0 0 0.3rem; color: #1e4f8f; }
@media (max-width: 1100px) {
  .student-grid { grid-template-columns: repeat(3, minmax(120px, 1fr)); }
  .filters-grid { grid-template-columns: repeat(3, minmax(120px, 1fr)); }
  .search-field { grid-column: span 3; }
}
@media (max-width: 768px) {
  .summary-card { grid-template-columns: 1fr; }
  .student-grid, .filters-grid, .search-field { grid-template-columns: 1fr; grid-column: auto; }
}
</style>
