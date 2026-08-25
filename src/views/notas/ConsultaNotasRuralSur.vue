<template>
  <div class="p-2 p-md-3">
    <div class="mb-3">
      <b-button variant="outline-primary" @click="volverAlMenu">&larr; Regresar al menu del estudiante</b-button>
    </div>

    <section class="notas-page">

      <!-- Resumen estudiante -->
      <article class="card summary-card">
        <div class="student-photo-wrap">
          <img v-if="estudiante.foto" :src="estudiante.foto" alt="Foto estudiante" class="student-photo">
          <div v-else class="student-photo placeholder-photo">Sin foto</div>
        </div>
        <div class="student-content">
          <h2 class="student-name">{{ estudiante.estudiante || '-' }}</h2>
          <p class="student-doc">{{ estudiante.tipodocumento || '-' }} &middot; {{ estudiante.documento || '-' }}</p>
          <div class="student-grid">
            <div class="item"><span>Sede</span><strong>{{ estudiante.sede || '-' }}</strong></div>
            <div class="item"><span>Grado</span><strong>{{ estudiante.grado || '-' }}</strong></div>
            <div class="item"><span>Curso</span><strong>{{ estudiante.curso || '-' }}</strong></div>
            <div class="item"><span>Jornada</span><strong>{{ estudiante.jornada || '-' }}</strong></div>
            <div class="item"><span>Institucion</span><strong>{{ estudiante.nombreInstitucion || nombreInstitucionFallback }}</strong></div>
            <div class="item"><span>Vigencia</span><strong>{{ vigencia }}</strong></div>
          </div>
        </div>
      </article>

      <!-- Filtros + leyenda -->
      <article class="card filters-card">
        <h3>Historico academico</h3>
        <!-- Fila 1: selectores -->
        <div class="filters-selects">
          <div class="field">
            <label>Periodo</label>
            <select v-model="periodoSeleccionado">
              <option :value="OPCION_ACUMULADO">Acumulado</option>
              <option v-for="p in periodosDisponibles" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div class="field" v-if="periodoSeleccionado === OPCION_ACUMULADO">
            <label>Rango acumulado</label>
            <select v-model="rangoAcumulado">
              <option v-for="op in opcionesRangoAcumulado" :key="op" :value="op">1 a {{ op.split('-')[1] }}</option>
            </select>
          </div>
          <div class="field">
            <label>Area</label>
            <select v-model="filtroArea">
              <option value="">Todas</option>
              <option v-for="a in areaOptions" :key="a" :value="a">{{ a }}</option>
            </select>
          </div>
        </div>
        <!-- Fila 2: leyendas -->
        <div class="filters-legends">
          <div v-if="config && !esPreescolar" class="legend-col">
            <label>Criterios de evaluacion</label>
            <div class="legend-row">
              <span v-if="config.estadoC1" class="badge badge-crit mr-1">{{ config.nombreC1 }} {{ config.porcentajeC1 }}%</span>
              <span v-if="config.estadoC2" class="badge badge-crit mr-1">{{ config.nombreC2 }} {{ config.porcentajeC2 }}%</span>
              <span v-if="config.estadoC3" class="badge badge-crit">{{ config.nombreC3 }} {{ config.porcentajeC3 }}%</span>
            </div>
          </div>
          <div class="legend-col">
            <label>Conceptos</label>
            <!-- Preescolar: letras de secciones_ie -->
            <div v-if="esPreescolar && config" class="legend-row">
              <span v-if="config.preeL2" :class="['badge mr-1', conceptoClass(config.preeL2)]">{{ config.preeL2 }} - {{ config.preeC2 }}</span>
              <span v-if="config.preeL3" :class="['badge mr-1', conceptoClass(config.preeL3)]">{{ config.preeL3 }} - {{ config.preeC3 }}</span>
              <span v-if="config.preeL4" :class="['badge', conceptoClass(config.preeL4)]">{{ config.preeL4 }} - {{ config.preeC4 }}</span>
            </div>
            <div v-else class="legend-row">
              <template v-if="config">
                <div class="legend-group">
                  <span class="legend-tipo">Academica</span>
                  <span class="badge badge-low mr-1">BAJO {{ config.minBaj }} - {{ config.maxBaj }}</span>
                  <span class="badge badge-mid mr-1">BASICO {{ config.minBas }} - {{ config.maxBas }}</span>
                  <span class="badge badge-blue mr-1">ALTO {{ config.minAlt }} - {{ config.maxAlt }}</span>
                  <span class="badge badge-high">SUPERIOR {{ config.minSup }} - {{ config.maxSup }}</span>
                </div>
                <div v-if="tieneTecnica" class="legend-group">
                  <span class="legend-tipo tecnica">Tecnica</span>
                  <span class="badge badge-low mr-1">BAJO {{ config.minBajT }} - {{ config.maxBajT }}</span>
                  <span class="badge badge-mid mr-1">BASICO {{ config.minBasT }} - {{ config.maxBasT }}</span>
                  <span class="badge badge-blue mr-1">ALTO {{ config.minAltT }} - {{ config.maxAltT }}</span>
                  <span class="badge badge-high">SUPERIOR {{ config.minSupT }} - {{ config.maxSupT }}</span>
                </div>
              </template>
              <template v-else>
                <div class="legend-group">
                  <span class="badge badge-low mr-1">BAJO</span>
                  <span class="badge badge-mid mr-1">BASICO</span>
                  <span class="badge badge-blue mr-1">ALTO</span>
                  <span class="badge badge-high">SUPERIOR</span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="filters-footer">
          {{ rowsFiltrados.length }} asignatura(s)
          <span v-if="promedioGeneralActual !== null" class="ml-2">• Promedio final general actual: <strong>{{ asScore(promedioGeneralActual) }}</strong></span>
        </div>
      </article>

      <!-- Cargando -->
      <div v-if="cargando" class="card state-block">Cargando notas...</div>

      <!-- Sin registros -->
      <div v-else-if="!rows.length && consultaRealizada" class="card state-block empty">
        <h4>Sin registros</h4>
        <p>No hay notas registradas para la vigencia {{ vigencia }}.</p>
      </div>

      <!-- Evaluacion conceptual: no van notas -->
      <div v-else-if="esConceptual && rows.length" class="card state-block">
        <div class="conceptual-badge">EVALUACION CONCEPTUAL</div>
        <p class="mt-2 text-muted">Este estudiante es evaluado de forma conceptual. Contacte al colegio para mayor informacion.</p>
      </div>

      <!-- Notas agrupadas por area -->
      <template v-else-if="rows.length">
        <div v-for="(items, area) in porArea" :key="area" class="area-group">
          <div class="area-header">{{ area }}</div>
          <article v-for="row in items" :key="row.__key" class="card asig-card">
            <div class="asig-row">

              <div class="asig-info">
                <div class="asig-nombre">{{ row.nombreAsignatura || row.nemo || '-' }}</div>
                <div class="asig-periodo">{{ row.esAcumulado ? acumuladoLabel : ('Periodo ' + row.periodo) }}
                  <span v-if="row.tipoAsignatura === 2" class="tipo-tecnica">Tecnica</span>
                </div>
              </div>

              <div class="criterios-inline">

                <!-- ===== PREESCOLAR (nivelGrado=1): definitivapree ===== -->
                <template v-if="esPreescolar">
                  <div class="crit-box crit-main">
                    <div class="crit-label">Nota</div>
                    <span :class="['badge', 'badge-lg', preeClass(row)]">{{ preeDisplay(row) }}</span>
                  </div>
                </template>

                <!-- ===== PRIMARIA / SECUNDARIA / MEDIA: criterios C1 C2 C3 + definitiva ===== -->
                <template v-else>
                  <div v-if="config && config.estadoC1 && !row.esAcumulado" class="crit-box">
                    <div class="crit-label">{{ config.nombreC1 }}</div>
                    <span :class="['badge', scoreClass(row.defC1, row.tipoAsignatura)]">{{ asScore(row.defC1) }}</span>
                  </div>
                  <div v-if="config && config.estadoC2 && !row.esAcumulado" class="crit-box">
                    <div class="crit-label">{{ config.nombreC2 }}</div>
                    <span :class="['badge', scoreClass(row.defC2, row.tipoAsignatura)]">{{ asScore(row.defC2) }}</span>
                  </div>
                  <div v-if="config && config.estadoC3 && !row.esAcumulado" class="crit-box">
                    <div class="crit-label">{{ config.nombreC3 }}</div>
                    <span :class="['badge', scoreClass(row.defC3, row.tipoAsignatura)]">{{ asScore(row.defC3) }}</span>
                  </div>
                  <template v-if="row && row.esAcumulado">
                    <div v-for="p in periodosRangoAcumulado" :key="row.__key + '-p' + p" class="crit-box">
                      <div class="crit-label">P{{ p }}</div>
                      <span :class="['badge', notaPeriodoAcumuladoClass(row, p)]">{{ notaPeriodoAcumuladoDisplay(row, p) }}</span>
                    </div>
                  </template>
                  <div class="crit-box crit-main">
                    <div class="crit-label">Definitiva</div>
                    <span :class="['badge', 'badge-lg', scoreClass(definitivaCalc(row), row.tipoAsignatura)]">{{ asScore(definitivaCalc(row)) }}</span>
                  </div>
                  <div class="crit-box">
                    <div class="crit-label">Concepto</div>
                    <span :class="['badge', conceptoClass(conceptoCalc(row))]">{{ conceptoCalc(row) }}</span>
                  </div>
                  <div v-if="Number(row.recuperacion) > 0 && !row.esAcumulado" class="crit-box">
                    <div class="crit-label">Recupera</div>
                    <span :class="['badge', scoreClass(row.recuperacion, row.tipoAsignatura)]">{{ asScore(row.recuperacion) }}</span>
                  </div>
                </template>

                <!-- ===== COMPORTAMIENTO (siempre si tiene valor) ===== -->
                <div v-if="tieneCompor(row) && !row.esAcumulado" class="crit-box crit-sep">
                  <div class="crit-label">Compor.</div>
                  <span :class="['badge', comporClass(row)]">{{ comporDisplay(row) }}</span>
                </div>

                <!-- ===== AUSENCIAS (siempre visibles) ===== -->
                <div v-if="!row.esAcumulado" class="crit-box crit-sep">
                  <div class="crit-label">Ausencias</div>
                  <div>
                    <span :class="['badge mr-1', row.ausJ > 0 ? 'badge-low' : 'badge-zero']">J:{{ row.ausJ || 0 }}</span>
                    <span :class="['badge', row.ausS > 0 ? 'badge-mid' : 'badge-zero']">S:{{ row.ausS || 0 }}</span>
                  </div>
                </div>

              </div>
            </div>
          </article>
        </div>

        <!-- Boletín -->
        <article class="card boletin-card" v-if="config">
          <h3>Boletin</h3>
          <p class="text-muted small mb-2">
            Se generará para:
            <strong>{{ periodoSeleccionado === OPCION_ACUMULADO ? ('Acumulado 1 a ' + rangoAcumulado.split('-')[1]) : ('Periodo ' + periodoSeleccionado) }}</strong>
          </p>
          <BoletinAcudiente v-if="!esPreescolar"
            :idMatricula="String($route.params.idMatricula)"
            :idCurso="estudiante.idCurso"
            :vigencia="vigencia"
            :periodosVisibles="periodosVisiblesBoletin"
            :estudiante="estudiante"
            :config="config"
            :nombreInstitucion="estudiante.nombreInstitucion || nombreInstitucionFallback"
            :escudoInstitucion="escudoInstitucion"
          />
          <BoletinPree v-else
            :idMatricula="String($route.params.idMatricula)"
            :idCurso="estudiante.idCurso"
            :vigencia="vigencia"
            :periodosVisibles="periodosVisiblesBoletin"
            :estudiante="estudiante"
            :config="config"
            :nombreInstitucion="estudiante.nombreInstitucion || nombreInstitucionFallback"
            :escudoInstitucion="escudoInstitucion"
          />
        </article>
      </template>

    </section>
  </div>
</template>

<script>
import axios from 'axios'
import * as CONFIG from '@/assets/config.js'
import BoletinAcudiente from '@/views/boletines/BoletinRuralSur'
import BoletinPree from '@/views/boletines/BoletinPreeRuralSur'

const ID_RURAL_SUR = '097b7b10-fcaa-11ec-8267-536b07c743c4'
const OPCION_ACUMULADO = 'ACUMULADO'

export default {
  name: 'ConsultaNotasRuralSur',
  components: { BoletinAcudiente, BoletinPree },
  data () {
    return {
      OPCION_ACUMULADO,
      cargando: true,
      consultaRealizada: false,
      rows: [],
      estudiante: {},
      vigencia: '',
      config: null,
      periodoSeleccionado: null,
      rangoAcumulado: '1-4',
      filtroArea: '',
      nombreInstitucionFallback: 'INSTITUCIÓN EDUCATIVA RURAL DEL SUR',
      escudoInstitucion: ''
    }
  },
  computed: {
    esPreescolar () {
      return Number(this.estudiante.nivelGrado) === 1
    },
    esConceptual () {
      return String(this.estudiante.conceptual || '').trim().toUpperCase() === 'S'
    },
    tieneTecnica () {
      return this.rows.some(r => Number(r.tipoAsignatura) === 2)
    },
    numPeriodos () {
      return Number(this.config?.numPeriodos) || 4
    },
    pesosPeriodos () {
      const c = this.config || {}
      return { 1: Number(c.pesoP1) || 0, 2: Number(c.pesoP2) || 0, 3: Number(c.pesoP3) || 0, 4: Number(c.pesoP4) || 0 }
    },
    periodosDisponibles () {
      return [...new Set(this.rows.map(r => r.periodo))].sort((a, b) => a - b)
    },
    opcionesRangoAcumulado () {
      const opciones = []
      for (let p = 2; p <= this.numPeriodos; p++) opciones.push('1-' + p)
      return opciones.length ? opciones : ['1-4']
    },
    periodosRangoAcumulado () {
      const hasta = Number(this.rangoAcumulado.split('-')[1]) || this.numPeriodos
      const arr = []
      for (let p = 1; p <= hasta; p++) arr.push(p)
      return arr
    },
    periodosVisiblesBoletin () {
      if (this.periodoSeleccionado === this.OPCION_ACUMULADO) return this.periodosRangoAcumulado
      return this.periodoSeleccionado ? [this.periodoSeleccionado] : [1]
    },
    acumuladoLabel () {
      const partes = this.periodosRangoAcumulado.map(p => 'P' + p + ' ' + (this.pesosPeriodos[p] || 0) + '%')
      return 'Acumulado (' + partes.join(' • ') + ')'
    },
    rowsAcumulados () {
      const porAsignatura = {}
      this.rows.forEach(r => {
        const key = String(r.idAsignaturaCurso || (r.nemoArea + '-' + r.nemo + '-' + r.nombreAsignatura))
        if (!porAsignatura[key]) porAsignatura[key] = []
        porAsignatura[key].push(r)
      })

      return Object.keys(porAsignatura).map(key => {
        const registros = porAsignatura[key]
        const base = [...registros].sort((a, b) => (Number(b.periodo) || 0) - (Number(a.periodo) || 0))[0] || {}
        const acumulado = this.calcularAcumuladoPorMateria(registros)
        return {
          ...base,
          __key: key + '-acumulado',
          periodo: 'A',
          esAcumulado: true,
          defC1: null,
          defC2: null,
          defC3: null,
          recuperacion: 0,
          definitivacompor: null,
          ausJ: 0,
          ausS: 0,
          definitiva: acumulado.definitiva,
          periodosFinales: acumulado.periodosFinales || {}
        }
      }).sort((a, b) => {
        const areaA = (a.nombreArea || a.nemoArea || '').toString()
        const areaB = (b.nombreArea || b.nemoArea || '').toString()
        if (areaA !== areaB) return areaA.localeCompare(areaB)
        const asigA = (a.nombreAsignatura || a.nemo || '').toString()
        const asigB = (b.nombreAsignatura || b.nemo || '').toString()
        return asigA.localeCompare(asigB)
      })
    },
    areaOptions () {
      return [...new Set(this.rows.map(r => r.nombreArea || r.nemoArea).filter(Boolean))].sort()
    },
    rowsFiltrados () {
      const fuente = this.periodoSeleccionado === this.OPCION_ACUMULADO ? this.rowsAcumulados : this.rows
      return fuente.filter(r => {
        const okPeriodo = this.periodoSeleccionado === null || this.periodoSeleccionado === this.OPCION_ACUMULADO || r.periodo === this.periodoSeleccionado
        const areaVal = r.nombreArea || r.nemoArea || ''
        const okArea = !this.filtroArea || areaVal === this.filtroArea
        return okPeriodo && okArea
      })
    },
    promedioGeneralActual () {
      const acumuladas = this.rowsAcumulados
        .map(r => Number(r.definitiva))
        .filter(n => Number.isFinite(n) && n > 0)
      if (!acumuladas.length) return null
      const suma = acumuladas.reduce((acc, n) => acc + n, 0)
      return suma / acumuladas.length
    },
    porArea () {
      const grupos = {}
      this.rowsFiltrados.forEach(r => {
        const area = r.nombreArea || r.nemoArea || 'Sin area'
        if (!grupos[area]) grupos[area] = []
        grupos[area].push(r)
      })
      return grupos
    }
  },
  methods: {
    volverAlMenu () {
      const idMatricula = this.$route.params.idMatricula
      this.$router.push({ name: 'menu-estudiante', params: { idMatricula: String(idMatricula || '') } })
    },

    conceptoCalc (row) {
      if (!this.config) return row.concepto || '-'
      const def = Number(this.definitivaCalc(row))
      if (!def || isNaN(def)) return row.concepto || '-'
      const tecnica = Number(row.tipoAsignatura) === 2
      const maxBaj = Number(tecnica ? this.config.maxBajT : this.config.maxBaj) || 0
      const maxBas = Number(tecnica ? this.config.maxBasT : this.config.maxBas) || 0
      const maxAlt = Number(tecnica ? this.config.maxAltT : this.config.maxAlt) || 0
      if (!maxBaj && !maxBas && !maxAlt) return row.concepto || '-'
      if (def <= maxBaj) return 'BAJO'
      if (def <= maxBas) return 'BASICO'
      if (def <= maxAlt) return 'ALTO'
      return 'SUPERIOR'
    },

    definitivaCalc (row) {
      if (!this.config) return row.definitiva
      if (row && row.esAcumulado) return row.definitiva
      const p1 = this.config.estadoC1 ? (Number(this.config.porcentajeC1) || 0) : 0
      const p2 = this.config.estadoC2 ? (Number(this.config.porcentajeC2) || 0) : 0
      const p3 = this.config.estadoC3 ? (Number(this.config.porcentajeC3) || 0) : 0
      if (p1 + p2 + p3 === 0) return row.definitiva
      const c1 = Number(row.defC1) || 0
      const c2 = Number(row.defC2) || 0
      const c3 = Number(row.defC3) || 0
      const total = (c1 * p1 + c2 * p2 + c3 * p3) / 100
      return total > 0 ? total : row.definitiva
    },

    calcularAcumuladoPorMateria (registros) {
      const periodos = this.periodosRangoAcumulado
      const pesos = this.pesosPeriodos
      const totalPesos = periodos.reduce((acc, p) => acc + (pesos[p] || 0), 0)
      if (!totalPesos) return { definitiva: 0, periodosFinales: {} }

      const notaPorPeriodo = {}
      const periodosFinales = {}

      registros.forEach(r => {
        const p = Number(r.periodo)
        if (!periodos.includes(p)) return
        const nota = Number(this.definitivaCalc(r))
        notaPorPeriodo[p] = Number.isFinite(nota) && nota > 0 ? nota : 0
        periodosFinales[p] = Number.isFinite(nota) && nota > 0 ? nota : 0
      })

      periodos.forEach(p => {
        if (periodosFinales[p] === undefined) periodosFinales[p] = 0
      })

      const total = periodos.reduce((acc, p) => acc + ((notaPorPeriodo[p] || 0) * (pesos[p] || 0)), 0)

      return { definitiva: total / totalPesos, periodosFinales }
    },

    notaPeriodoAcumuladoDisplay (row, periodo) {
      const v = row && row.periodosFinales ? row.periodosFinales[periodo] : undefined
      const n = Number(v)
      return Number.isFinite(n) ? n.toFixed(1) : '-'
    },
    notaPeriodoAcumuladoClass (row, periodo) {
      const v = row && row.periodosFinales ? row.periodosFinales[periodo] : undefined
      return this.scoreClass(v, row.tipoAsignatura)
    },

    asScore (v) {
      if (v === null || v === undefined || v === '' || v === 0 || v === '0') return '-'
      const n = Number(v)
      return Number.isNaN(n) ? String(v) : n.toFixed(1)
    },

    scoreClass (v, tipoAsig) {
      if (v === null || v === undefined || v === '' || v === 0 || v === '0') return 'badge-mid'
      const n = Number(v)
      if (Number.isNaN(n) || n === 0) return 'badge-mid'
      if (this.config) {
        const tecnica = Number(tipoAsig) === 2
        const maxBaj = Number(tecnica ? this.config.maxBajT : this.config.maxBaj) || 2.9
        const maxBas = Number(tecnica ? this.config.maxBasT : this.config.maxBas) || 3.9
        const maxAlt = Number(tecnica ? this.config.maxAltT : this.config.maxAlt) || 4.5
        if (n <= maxBaj) return 'badge-low'
        if (n <= maxBas) return 'badge-mid'
        if (n <= maxAlt) return 'badge-blue'
        return 'badge-high'
      }
      if (n < 3.0) return 'badge-low'
      if (n < 4.0) return 'badge-mid'
      if (n < 4.5) return 'badge-blue'
      return 'badge-high'
    },

    conceptoClass (concepto) {
      if (!concepto || concepto === '-') return 'badge-mid'
      const c = String(concepto).toUpperCase().trim()
      if (c === 'SUPERIOR') return 'badge-high'
      if (c === 'ALTO') return 'badge-blue'
      if (c === 'BASICO' || c === 'BÁSICO') return 'badge-mid'
      if (c === 'BAJO') return 'badge-low'
      if (c === 'LOGRADO' || c === 'L') return 'badge-high'
      if (c.startsWith('NO LOGRADO') || c === 'NL') return 'badge-low'
      if (c === 'INSUFICIENTE' || c === 'I') return 'badge-low'
      if (c === 'ACEPTABLE' || c === 'A') return 'badge-mid'
      if (c === 'EXCELENTE' || c === 'E') return 'badge-high'
      if (c === 'SOBRESALIENTE') return 'badge-blue'
      if (c === 'SUPERADO') return 'badge-high'
      if (c === 'P' || c === 'EN PROCESO') return 'badge-mid'
      if (c === 'R' || c.startsWith('NEC')) return 'badge-low'
      return 'badge-mid'
    },

    preeDisplay (row) {
      const v = row.definitivapree
      if (v === null || v === undefined || v === '' || v === 0 || v === '0') return row.concepto || '-'
      const n = Number(v)
      return Number.isNaN(n) ? String(v) : n.toFixed(1)
    },
    preeClass (row) {
      const v = row.definitivapree
      if (!v) return row.concepto ? this.conceptoClass(row.concepto) : 'badge-mid'
      const n = Number(v)
      if (Number.isNaN(n)) return this.conceptoClass(String(v))
      return this.scoreClass(v, 1)
    },

    tieneCompor (row) {
      const v = row.definitivacompor
      return v !== null && v !== undefined && v !== '' && v !== 0 && v !== '0'
    },
    comporDisplay (row) {
      const v = row.definitivacompor
      if (v === null || v === undefined || v === '' || v === 0 || v === '0') return '-'
      const n = Number(v)
      return Number.isNaN(n) ? String(v) : n.toFixed(1)
    },
    comporClass (row) {
      const v = row.definitivacompor
      if (!v) return 'badge-mid'
      const n = Number(v)
      if (Number.isNaN(n)) return this.conceptoClass(String(v))
      return this.scoreClass(v, 1)
    },

    async cargarConfig () {
      try {
        const resp = await axios.get(CONFIG.ROOT_PATH + 'acudientes/config-evaluacion', {
          params: { idInstitucion: ID_RURAL_SUR, vigencia: this.vigencia }
        })
        if (!resp.data.error && resp.data.datos) this.config = resp.data.datos
      } catch (e) { /* no critico */ }
    },

    async cargarNotas () {
      const idMatricula = this.$route.params.idMatricula
      if (!idMatricula) { this.cargando = false; return }
      try {
        const resp = await axios.get(CONFIG.ROOT_PATH + 'acudientes/historico-notas/estudiante', {
          params: { idMatricula: idMatricula, periodo: 5, vigencia: this.vigencia },
          timeout: 20000
        })
        if (!resp.data.error && resp.data.datos !== 0) {
          this.rows = (resp.data.datos || []).map((r, idx) => ({
            __key: (r.idAsignaturaCurso || idx) + '-' + r.periodo,
            idAsignaturaCurso: r.idAsignaturaCurso,
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
            definitivacompor: r.definitivacompor || null,
            definitivapree: r.definitivapree || null,
            concepto: r.concepto,
            ausJ: Number(r.ausJ) || 0,
            ausS: Number(r.ausS) || 0,
            observaciones: r.observaciones || '',
            tipoAsignatura: Number(r.tipoAsignatura) || 1,
            esAcumulado: false
          }))
          if (this.periodosDisponibles.length) {
            this.periodoSeleccionado = this.periodosDisponibles[this.periodosDisponibles.length - 1]
          }
        }
      } catch (e) {
        this.$bvToast.toast('Error cargando las notas. ' + e, {
          title: CONFIG.TITULO_MSG, variant: 'danger',
          toaster: 'b-toaster-top-center', solid: true, autoHideDelay: 3500, appendToast: false
        })
      } finally {
        this.cargando = false
        this.consultaRealizada = true
      }
    }
  },
  beforeMount () {
    const idMatricula = this.$route.params.idMatricula
    if (!idMatricula) { this.$router.replace({ name: 'inicio-acudiente' }); return }
    const estudiantes = JSON.parse(sessionStorage.getItem('acudienteEstudiantes') || '[]')
    this.estudiante = estudiantes.find(function (x) { return String(x.idMatricula) === String(idMatricula) }) || {}
    this.vigencia = sessionStorage.getItem('acudienteVigencia') || String(new Date().getFullYear())
    const escudo = sessionStorage.getItem('acudienteEscudoInstitucion') || ''
    this.escudoInstitucion = escudo ? (CONFIG.ROOT_ESCUDOS + escudo) : ''
    this.cargarConfig()
    this.cargarNotas()
  }
}
</script>

<style scoped>
/* ── Layout general ── */
.notas-page { background: #f3f6fa; min-height: 100%; color: #24313f; }
.card { background: #fff; border-radius: 14px; box-shadow: 0 8px 20px rgba(0, 30, 70, 0.08); margin-bottom: 1rem; }

/* ── Resumen estudiante ── */
.summary-card { display: grid; grid-template-columns: 110px 1fr; gap: 1rem; padding: 1rem; }
.student-photo-wrap { display: flex; align-items: center; justify-content: center; }
.student-photo { width: 86px; height: 86px; border-radius: 50%; object-fit: cover; border: 3px solid #d4e1ef; }
.placeholder-photo { width: 86px; height: 86px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #e8eef5; color: #6b7a8a; }
.student-name { margin: 0; color: #1e4f8f; font-size: 1.2rem; }
.student-doc { margin: 0.2rem 0 0.8rem; color: #65788b; }
.student-grid { display: grid; grid-template-columns: repeat(6, minmax(120px, 1fr)); gap: 0.75rem; }
.item span { display: block; font-size: 0.74rem; color: #7b8a99; }
.item strong { font-size: 0.9rem; }

/* ── Filtros ── */
.filters-card { padding: 1rem; }
.filters-card h3 { margin: 0 0 0.9rem; color: #1e4f8f; font-size: 1.05rem; }
.filters-selects { display: flex; gap: 0.7rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.filters-selects .field { min-width: 140px; }
.filters-legends { display: flex; gap: 2rem; flex-wrap: wrap; padding-top: 0.5rem; border-top: 1px solid #eaf0f8; }
.legend-col { display: flex; flex-direction: column; gap: 0.35rem; }
.legend-col label { display: block; font-size: 0.76rem; color: #6d7d8e; margin-bottom: 0; }
.field label { display: block; font-size: 0.76rem; color: #6d7d8e; margin-bottom: 0.2rem; }
.field select { width: 100%; border: 1px solid #d5dfeb; border-radius: 8px; padding: 0.5rem 0.65rem; }
.legend-row { display: flex; flex-direction: column; gap: .3rem; }
.legend-group { display: flex; flex-wrap: wrap; gap: .3rem; align-items: center; }
.legend-tipo { font-size: .68rem; font-weight: 700; color: #1e4f8f; text-transform: uppercase; letter-spacing: .03em; min-width: 62px; }
.legend-tipo.tecnica { color: #7a4000; }
.filters-footer { text-align: right; font-size: .78rem; color: #617486; margin-top: .5rem; }

/* ── Estados ── */
.state-block { text-align: center; color: #617486; padding: 2rem 1rem; }
.state-block.empty h4 { margin: 0 0 0.3rem; color: #1e4f8f; }
.conceptual-badge {
  display: inline-block;
  background: #e8f0fe;
  color: #1e4f8f;
  font-weight: 700;
  font-size: .85rem;
  padding: .4rem 1.2rem;
  border-radius: 999px;
  letter-spacing: .04em;
}

/* ── Badges ── */
.badge { border-radius: 999px; padding: 0.16rem 0.55rem; font-weight: 700; font-size: 0.75rem; display: inline-block; }
.badge-lg  { font-size: 0.92rem; padding: 0.22rem 0.7rem; }
.badge-low  { background: rgba(202, 44, 44, 0.15); color: #a82828; }
.badge-mid  { background: rgba(219, 169, 19, 0.20); color: #8f6b05; }
.badge-high { background: rgba(33, 153, 77, 0.18);  color: #1f7f44; }
.badge-blue { background: rgba(20, 90, 200, 0.15);  color: #1452a5; }
.badge-crit { background: rgba(0, 50, 130, 0.10);   color: #1e4f8f; }
.badge-zero { background: rgba(0,0,0,0.06); color: #9aabb8; }

/* ── Areas y asignaturas ── */
.area-group { margin-bottom: 1.5rem; }
.area-header {
  background: #dce6f5; color: #1a3f7a; font-weight: 700; font-size: .82rem;
  text-transform: uppercase; letter-spacing: .04em;
  padding: .4rem 1rem; border-radius: 10px 10px 0 0; margin-bottom: 2px;
}
.asig-card {
  border-left: 3px solid #6b9fd4;
  border-radius: 0 10px 10px 0 !important;
  padding: .6rem 1rem;
  margin-bottom: 4px;
  box-shadow: 0 2px 6px rgba(0, 30, 70, 0.06) !important;
}
.asig-row { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; }
.asig-info { min-width: 180px; flex: 0 0 200px; }
.asig-nombre { font-weight: 600; font-size: .9rem; color: #1a3058; }
.asig-periodo { font-size: .72rem; color: #7b8a99; margin-top: 2px; }
.tipo-tecnica {
  display: inline-block;
  background: rgba(130, 70, 0, .12);
  color: #7a4000;
  font-size: .65rem;
  font-weight: 700;
  padding: .06rem .35rem;
  border-radius: 4px;
  margin-left: .4rem;
  vertical-align: middle;
}
.criterios-inline { display: flex; flex-wrap: wrap; gap: .7rem; align-items: flex-end; }
.crit-box { text-align: center; }
.crit-label { font-size: .64rem; color: #7b8ea6; text-transform: uppercase; letter-spacing: .03em; margin-bottom: 3px; }
.crit-main .badge-lg { font-size: 1rem; }
.crit-sep { border-left: 1px dashed #d0daea; padding-left: .7rem; }

/* ── Boletín ── */
.boletin-card { padding: 1rem; }
.boletin-card h3 { margin: 0 0 0.5rem; color: #1e4f8f; font-size: 1.05rem; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .student-grid { grid-template-columns: repeat(3, minmax(100px, 1fr)); }
  .filters-legends { gap: 1.2rem; }
}
@media (max-width: 768px) {
  .summary-card { grid-template-columns: 1fr; }
  .student-grid { grid-template-columns: 1fr; }
  .filters-selects { flex-direction: column; }
  .filters-legends { flex-direction: column; gap: 0.8rem; }
  .asig-info { flex: 0 0 100%; }
}
</style>
