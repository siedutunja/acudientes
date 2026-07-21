<template>
  <div class="obs-page">

    <!-- Botón volver -->
    <button class="btn-volver" @click="volver">← Regresar al menú</button>

    <!-- Error de sesión -->
    <div v-if="errorSesion" class="alerta-error">
      No se encontró información del estudiante. Por favor regresa e ingresa nuevamente.
    </div>

    <template v-else>
      <!-- Tarjeta resumen del estudiante -->
      <div class="card-resumen">
        <div class="resumen-foto">
          <img v-if="est.foto" :src="est.foto" alt="Foto" class="foto-img">
          <div v-else class="foto-placeholder">{{ iniciales }}</div>
        </div>
        <div class="resumen-info">
          <h2 class="resumen-nombre">{{ est.nombreCompleto }}</h2>
          <p class="resumen-doc">{{ est.tipodocumento }} {{ est.documento }}</p>
          <div class="resumen-grid">
            <div><span>Edad</span><strong>{{ est.edad || '-' }}</strong></div>
            <div><span>Género</span><strong>{{ est.genero || '-' }}</strong></div>
            <div><span>RH</span><strong>{{ est.rh || '-' }}</strong></div>
            <div><span>Sede</span><strong>{{ est.sede || '-' }}</strong></div>
            <div><span>Grado</span><strong>{{ est.grado || '-' }}</strong></div>
            <div><span>Curso</span><strong>{{ est.curso || '-' }}</strong></div>
            <div><span>Jornada</span><strong>{{ est.jornada || '-' }}</strong></div>
            <div><span>Especialidad</span><strong>{{ est.especialidad || '-' }}</strong></div>
            <div><span>Acudiente</span><strong>{{ est.acudiente || '-' }}</strong></div>
            <div><span>Parentesco</span><strong>{{ est.parentesco || '-' }}</strong></div>
          </div>
        </div>
      </div>

      <!-- Tarjeta filtros -->
      <div class="card-filtros">
        <div class="filtros-header">
          <h3>Observador académico</h3>
          <span class="total-badge">{{ observaciones.length }} registro{{ observaciones.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="filtros-grid">
          <div class="filtro-campo">
            <label>Buscar</label>
            <input v-model.trim="buscar" type="text" placeholder="Situación, responsable, rol...">
          </div>
          <div class="filtro-campo">
            <label>Tipo de observación</label>
            <select v-model="filtroTipo">
              <option value="">Todos</option>
              <option v-for="t in tiposDisponibles" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="filtro-campo">
            <label>Estado de seguimiento</label>
            <select v-model="filtroEstado">
              <option value="">Todos</option>
              <option v-for="e in estadosDisponibles" :key="e" :value="e">{{ e }}</option>
            </select>
          </div>

        </div>

        <div v-if="filtrosActivos" class="filtros-activos">
          <span>Mostrando {{ filtradas.length }} de {{ observaciones.length }}</span>
          <button class="btn-limpiar" @click="limpiarFiltros">Limpiar filtros</button>
        </div>
      </div>

      <!-- Tabla de observaciones -->
      <div class="card-tabla">
        <!-- Cargando -->
        <div v-if="cargando" class="estado-bloque">
          <div class="spinner"></div>
          <p>Cargando observaciones...</p>
        </div>

        <!-- Sin datos -->
        <div v-else-if="!observaciones.length" class="estado-bloque">
          <p class="estado-titulo">Sin observaciones</p>
          <p>Este estudiante no tiene observaciones registradas{{ modoHistorico ? '' : ' en la vigencia ' + vigencia }}.</p>
        </div>

        <!-- Sin resultados con filtros -->
        <div v-else-if="!filtradas.length" class="estado-bloque">
          <p class="estado-titulo">Sin resultados</p>
          <p>Ninguna observación coincide con los filtros aplicados.</p>
        </div>

        <!-- Tabla -->
        <div v-else>
          <!-- Modo histórico aviso -->
          <div v-if="modoHistorico" class="aviso-historico">
            Mostrando historial completo — no hay observaciones registradas en la vigencia {{ vigencia }}.
          </div>

          <div class="tabla-scroll">
            <table class="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Aspecto</th>
                  <th>Tipo</th>
                  <th>Responsable</th>
                  <th>Rol</th>
                  <th>Seguimiento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(obs, i) in pagina"
                  :key="obs.id || i"
                  :class="{ 'fila-par': i % 2 === 0 }"
                >
                  <td class="td-fecha">{{ fmtFecha(obs.fecha_observacion) }}</td>
                  <td>
                    <span :class="['chip', chipTipo(obs.tipoobservacion)]">
                      {{ obs.tipoobservacion || '-' }}
                    </span>
                  </td>
                  <td>
                    <span :class="['chip', chipSubtipo(obs.subtipo)]">
                      {{ obs.subtipo || 'N/A' }}
                    </span>
                  </td>
                  <td class="td-responsable">{{ obs.responsable || '-' }}</td>
                  <td>{{ obs.rol || '-' }}</td>
                  <td>
                    <span :class="['chip', chipEstado(obs.estadoseguimiento)]">
                      {{ obs.estadoseguimiento || '-' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn-ver" @click="abrirDetalle(obs)">Ver</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginación -->
          <div class="paginacion" v-if="totalPaginas > 1">
            <button :disabled="paginaActual <= 1" @click="paginaActual--">‹</button>
            <span>Página {{ paginaActual }} de {{ totalPaginas }}</span>
            <button :disabled="paginaActual >= totalPaginas" @click="paginaActual++">›</button>
          </div>
        </div>
      </div>
    </template>

    <!-- Drawer detalle -->
    <div v-if="detalleAbierto" class="overlay" @click.self="cerrarDetalle">
      <div class="drawer">
        <div class="drawer-header">
          <h4>Detalle de observación</h4>
          <button class="btn-cerrar" @click="cerrarDetalle">✕</button>
        </div>
        <div class="drawer-body" v-if="obsSeleccionada">
          <div class="drawer-meta">
            <div class="meta-item">
              <span>Fecha</span>
              <strong>{{ fmtFecha(obsSeleccionada.fecha_observacion) }}</strong>
            </div>
            <div class="meta-item">
              <span>Vigencia</span>
              <strong>{{ obsSeleccionada.vigencia || '-' }}</strong>
            </div>
            <div class="meta-item">
              <span>Tipo</span>
              <strong>{{ obsSeleccionada.tipoobservacion || '-' }}</strong>
            </div>
            <div class="meta-item">
              <span>Falta</span>
              <strong>{{ obsSeleccionada.subtipo || 'N/A' }}</strong>
            </div>
            <div class="meta-item">
              <span>Responsable</span>
              <strong>{{ obsSeleccionada.responsable || '-' }}</strong>
            </div>
            <div class="meta-item">
              <span>Rol</span>
              <strong>{{ obsSeleccionada.rol || '-' }}</strong>
            </div>
            <div class="meta-item">
              <span>Seguimiento</span>
              <strong>{{ obsSeleccionada.estadoseguimiento || '-' }}</strong>
            </div>
            <div class="meta-item" v-if="obsSeleccionada.fecha_compromiso">
              <span>Fecha compromiso</span>
              <strong>{{ fmtFecha(obsSeleccionada.fecha_compromiso) }}</strong>
            </div>
          </div>

          <div class="drawer-seccion" v-if="obsSeleccionada.situacion">
            <label>Situación</label>
            <p>{{ obsSeleccionada.situacion }}</p>
          </div>
          <div class="drawer-seccion" v-if="obsSeleccionada.descargos">
            <label>Descargos</label>
            <p>{{ obsSeleccionada.descargos }}</p>
          </div>
          <div class="drawer-seccion" v-if="obsSeleccionada.compromisos">
            <label>Compromisos</label>
            <p>{{ obsSeleccionada.compromisos }}</p>
          </div>
          <div class="drawer-seccion" v-if="obsSeleccionada.seguimiento">
            <label>Seguimiento</label>
            <p>{{ obsSeleccionada.seguimiento }}</p>
          </div>
          <div class="drawer-seccion" v-if="obsSeleccionada.accionP">
            <label>Acción pedagógica</label>
            <p>{{ obsSeleccionada.accionP }}</p>
          </div>
          <div class="drawer-seccion" v-if="obsSeleccionada.accionR">
            <label>Acción reparadora</label>
            <p>{{ obsSeleccionada.accionR }}</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import * as CONFIG from '@/assets/config.js'

export default {
  name: 'ObservadorEstudiante',

  data () {
    return {
      errorSesion: false,
      cargando: false,
      observaciones: [],
      modoHistorico: false,
      vigencia: '',
      est: {
        nombreCompleto: '',
        tipodocumento: '',
        documento: '',
        foto: '',
        edad: '',
        genero: '',
        rh: '',
        sede: '',
        grado: '',
        curso: '',
        jornada: '',
        especialidad: '',
        acudiente: '',
        parentesco: ''
      },
      // Filtros
      buscar: '',
      filtroTipo: '',
      filtroEstado: '',
      filtroDesde: '',
      filtroHasta: '',
      // Paginación
      paginaActual: 1,
      porPagina: 10,
      // Detalle
      detalleAbierto: false,
      obsSeleccionada: null
    }
  },

  computed: {
    iniciales () {
      return this.est.nombreCompleto
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0])
        .join('')
        .toUpperCase()
    },

    tiposDisponibles () {
      return [...new Set(this.observaciones.map(o => o.tipoobservacion).filter(Boolean))].sort()
    },

    estadosDisponibles () {
      return [...new Set(this.observaciones.map(o => o.estadoseguimiento).filter(Boolean))].sort()
    },

    filtrosActivos () {
      return this.buscar || this.filtroTipo || this.filtroEstado || this.filtroDesde || this.filtroHasta
    },

    filtradas () {
      const txt = this.buscar.toLowerCase()
      const desde = this.filtroDesde ? new Date(this.filtroDesde) : null
      const hasta = this.filtroHasta ? new Date(this.filtroHasta + 'T23:59:59') : null

      return this.observaciones.filter(o => {
        if (txt) {
          const hayTexto = [o.nombre_situacion, o.responsable, o.rol, o.estadoseguimiento, o.tipoobservacion, o.situacion]
            .filter(Boolean).join(' ').toLowerCase().includes(txt)
          if (!hayTexto) return false
        }
        if (this.filtroTipo && o.tipoobservacion !== this.filtroTipo) return false
        if (this.filtroEstado && o.estadoseguimiento !== this.filtroEstado) return false
        if (desde || hasta) {
          const f = o.fecha_observacion ? new Date(o.fecha_observacion) : null
          if (!f) return false
          if (desde && f < desde) return false
          if (hasta && f > hasta) return false
        }
        return true
      })
    },

    totalPaginas () {
      return Math.max(1, Math.ceil(this.filtradas.length / this.porPagina))
    },

    pagina () {
      const ini = (this.paginaActual - 1) * this.porPagina
      return this.filtradas.slice(ini, ini + this.porPagina)
    }
  },

  watch: {
    filtradas () {
      this.paginaActual = 1
    }
  },

  methods: {
    fmtFecha (val) {
      if (!val) return '-'
      const raw = String(val).substring(0, 10)
      const [y, m, d] = raw.split('-')
      return `${d}/${m}/${y}`
    },

    chipTipo (tipo) {
      if (!tipo) return 'chip-gris'
      const t = tipo.toLowerCase()
      if (t.includes('academ')) return 'chip-azul'
      if (t.includes('disciplin') || t.includes('conduct')) return 'chip-amarillo'
      if (t.includes('conviv')) return 'chip-naranja'
      if (t.includes('positiv') || t.includes('logro')) return 'chip-verde'
      return 'chip-gris'
    },

    chipSubtipo (subtipo) {
      if (!subtipo || subtipo === 'No Aplica' || subtipo === 'N/A') return 'chip-gris'
      const s = subtipo.toLowerCase()
      if (s.includes('leve') || s.includes('tipo i') || s.includes('tipo ii') || s.includes('tipo iii')) return 'chip-amarillo'
      if (s.includes('grave') && !s.includes('gravis')) return 'chip-naranja'
      if (s.includes('gravis')) return 'chip-rojo'
      return 'chip-gris'
    },

    chipEstado (estado) {
      if (!estado) return 'chip-gris'
      const e = estado.toLowerCase()
      if (e.includes('finaliz') || e.includes('cerrad')) return 'chip-verde'
      if (e.includes('proceso')) return 'chip-azul'
      if (e.includes('no neces')) return 'chip-gris'
      return 'chip-gris'
    },

    limpiarFiltros () {
      this.buscar = ''
      this.filtroTipo = ''
      this.filtroEstado = ''
      this.filtroDesde = ''
      this.filtroHasta = ''
    },

    abrirDetalle (obs) {
      this.obsSeleccionada = obs
      this.detalleAbierto = true
    },

    cerrarDetalle () {
      this.detalleAbierto = false
      this.obsSeleccionada = null
    },

    volver () {
      const idMatricula = this.$route.params.idMatricula || ''
      this.$router.push({ name: 'menu-estudiante', params: { idMatricula } })
    },

    async cargar (idMatricula, idEstudiante) {
      this.cargando = true
      this.observaciones = []
      try {
        const { data } = await axios.get(CONFIG.ROOT_PATH + 'acudientes/observador/estudiante', {
          params: {
            idMatricula,
            idEstudiante,
            vigencia: this.vigencia,
            historico: 1,
            _t: Date.now()
          },
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 20000
        })

        if (data && data.error === false && data.datos && data.datos.observador) {
          const obs = data.datos.observador
          this.observaciones = Array.isArray(obs) ? obs : []
          this.modoHistorico = data.datos.modo_observador === 'historico'

          // Completar resumen con datos frescos del API
          const d = data.datos
          if (d.estudiante) this.est.nombreCompleto = d.estudiante
          if (d.tipodocumento) this.est.tipodocumento = d.tipodocumento
          if (d.documento) this.est.documento = d.documento
          if (d.foto) this.est.foto = d.foto
          if (d.edad) this.est.edad = d.edad
          if (d.genero) this.est.genero = d.genero
          if (d.rh) this.est.rh = d.rh
          if (d.sede) this.est.sede = d.sede
          if (d.grado) this.est.grado = d.grado
          if (d.curso) this.est.curso = d.curso
          if (d.jornada) this.est.jornada = d.jornada
          if (d.especialidad) this.est.especialidad = d.especialidad
          if (d.parentesco) this.est.parentesco = d.parentesco
        } else if (data && data.error) {
          this.$bvToast.toast(data.mensaje || 'Error consultando observador.', {
            title: CONFIG.TITULO_MSG, variant: 'warning',
            toaster: 'b-toaster-top-center', solid: true, autoHideDelay: 3000
          })
        }
      } catch (err) {
        console.error('[ObservadorEstudiante] Error:', err.message)
        this.$bvToast.toast('No fue posible conectar con el servidor. Intenta de nuevo.', {
          title: CONFIG.TITULO_MSG, variant: 'danger',
          toaster: 'b-toaster-top-center', solid: true, autoHideDelay: 3500
        })
      } finally {
        this.cargando = false
      }
    }
  },

  beforeMount () {
    const idMatricula = this.$route.params.idMatricula || ''
    const vigencia = sessionStorage.getItem('acudienteVigencia') || String(new Date().getFullYear())
    this.vigencia = vigencia

    const raw = sessionStorage.getItem('acudienteEstudiantes')
    const lista = raw ? JSON.parse(raw) : []
    const encontrado = lista.find(x => String(x.idMatricula) === String(idMatricula)) || null

    if (!encontrado || !idMatricula) {
      this.errorSesion = true
      return
    }

    // Poblar resumen desde sesión
    this.est = {
      nombreCompleto: encontrado.estudiante || encontrado.nombreCompleto || '',
      tipodocumento: encontrado.tipodocumento || '',
      documento: encontrado.documento || '',
      foto: encontrado.foto || '',
      edad: encontrado.edad || '',
      genero: encontrado.genero || '',
      rh: encontrado.rh || '',
      sede: encontrado.sede || '',
      grado: encontrado.grado || '',
      curso: encontrado.curso || '',
      jornada: encontrado.jornada || '',
      especialidad: encontrado.especialidad || '',
      acudiente: sessionStorage.getItem('acudienteNombre') || '',
      parentesco: encontrado.parentesco || ''
    }

    const idEstudiante = encontrado.idEstudiante || encontrado.id || ''
    this.cargar(idMatricula, idEstudiante)
  }
}
</script>

<style scoped>
/* ── Layout ── */
.obs-page {
  padding: 1rem 1.25rem;
  min-height: 100vh;
  background: #f4f6fb;
  color: #1a2535;
  font-family: inherit;
}

/* ── Botón volver ── */
.btn-volver {
  border: 1.5px solid #1f4e8c;
  background: transparent;
  color: #1f4e8c;
  border-radius: 8px;
  padding: 0.4rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1rem;
  display: inline-block;
}
.btn-volver:hover { background: #1f4e8c; color: #fff; }

/* ── Alerta error sesión ── */
.alerta-error {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  color: #856404;
  font-weight: 500;
}

/* ── Card base ── */
.card-resumen,
.card-filtros,
.card-tabla {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(15, 30, 65, 0.08);
  margin-bottom: 1rem;
  padding: 1.25rem 1.5rem;
}

/* ── Resumen estudiante ── */
.card-resumen {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.resumen-foto { flex-shrink: 0; }

.foto-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1f4e8c;
}

.foto-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #1f4e8c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
}

.resumen-nombre {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f4e8c;
  margin: 0 0 0.2rem;
  text-transform: uppercase;
}

.resumen-doc {
  font-size: 0.82rem;
  color: #5a7090;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.4rem 1rem;
}

.resumen-grid div span {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #d9a400;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.resumen-grid div strong {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1a2535;
}

/* ── Filtros ── */
.filtros-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.filtros-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1f4e8c;
  margin: 0;
}

.total-badge {
  background: #1f4e8c;
  color: #fff;
  border-radius: 999px;
  padding: 0.15rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.6rem 1rem;
}

.filtro-campo label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #5a7090;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.filtro-campo input,
.filtro-campo select {
  width: 100%;
  border: 1.5px solid #d1dbe8;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  color: #1a2535;
  background: #f8fafc;
  outline: none;
  box-sizing: border-box;
}

.filtro-campo input:focus,
.filtro-campo select:focus {
  border-color: #1f4e8c;
  background: #fff;
}

.filtros-activos {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.6rem;
  font-size: 0.82rem;
  color: #5a7090;
}

.btn-limpiar {
  border: none;
  background: none;
  color: #c0392b;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

/* ── Estado bloques ── */
.estado-bloque {
  text-align: center;
  padding: 2.5rem 1rem;
  color: #5a7090;
}

.estado-bloque .spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #d1dbe8;
  border-top-color: #1f4e8c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 0.75rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.estado-titulo {
  font-weight: 700;
  font-size: 1rem;
  color: #1f4e8c;
  margin-bottom: 0.25rem;
}

/* ── Aviso histórico ── */
.aviso-historico {
  background: #fff8e1;
  border-left: 4px solid #d9a400;
  border-radius: 6px;
  padding: 0.5rem 0.85rem;
  font-size: 0.82rem;
  color: #7a5800;
  margin-bottom: 0.75rem;
}

/* ── Tabla ── */
.tabla-scroll {
  overflow-x: auto;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.83rem;
}

.tabla thead tr {
  background: #1f4e8c;
  color: #fff;
}

.tabla thead th {
  padding: 0.6rem 0.85rem;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}

.tabla tbody tr {
  border-bottom: 1px solid #e8edf5;
  transition: background 0.12s;
}

.tabla tbody tr.fila-par { background: #f8fafc; }
.tabla tbody tr:hover { background: #eaf1fb; }

.tabla td {
  padding: 0.5rem 0.85rem;
  vertical-align: middle;
}

.td-fecha { white-space: nowrap; color: #5a7090; font-size: 0.8rem; }
.td-situacion { min-width: 170px; }
.td-responsable { min-width: 150px; }

/* ── Chips ── */
.chip {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.73rem;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.chip-azul    { background: rgba(31,78,140,0.12);  color: #1f4e8c; }
.chip-verde   { background: rgba(46,156,80,0.14);  color: #1a6e35; }
.chip-amarillo{ background: rgba(217,164,0,0.18);  color: #7a5800; }
.chip-naranja { background: rgba(230,126,34,0.15); color: #9a3e00; }
.chip-rojo    { background: rgba(192,57,43,0.14);  color: #8c1c12; }
.chip-gris    { background: rgba(108,117,125,0.12);color: #4a5568; }

/* ── Botón ver detalle ── */
.btn-ver {
  border: 1.5px solid #1f4e8c;
  background: transparent;
  color: #1f4e8c;
  border-radius: 6px;
  padding: 0.2rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-ver:hover { background: #1f4e8c; color: #fff; }

/* ── Paginación ── */
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0 0.25rem;
  font-size: 0.83rem;
  color: #5a7090;
}

.paginacion button {
  border: 1.5px solid #d1dbe8;
  background: #fff;
  border-radius: 7px;
  width: 2rem;
  height: 2rem;
  font-size: 1.1rem;
  cursor: pointer;
  color: #1f4e8c;
  font-weight: 700;
}
.paginacion button:disabled { opacity: 0.35; cursor: default; }

/* ── Overlay / Drawer ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 20, 40, 0.45);
  z-index: 1500;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: min(560px, 96vw);
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -6px 0 32px rgba(0,0,0,0.18);
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e8edf5;
  background: #1f4e8c;
  color: #fff;
}

.drawer-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.btn-cerrar {
  border: none;
  background: rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 6px;
  width: 2rem;
  height: 2rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 700;
}

.drawer-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.drawer-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem 1rem;
  background: #f4f6fb;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
}

.meta-item span {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #d9a400;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.meta-item strong {
  font-size: 0.85rem;
  color: #1a2535;
}

.drawer-seccion {
  margin-bottom: 0.9rem;
}

.drawer-seccion label {
  display: block;
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 700;
  color: #1f4e8c;
  margin-bottom: 0.25rem;
}

.drawer-seccion p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #1a2535;
  background: #f8fafc;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  border-left: 3px solid #1f4e8c;
}

/* ── Responsive ── */
@media (max-width: 600px) {
  .card-resumen { flex-direction: column; }
  .filtros-grid { grid-template-columns: 1fr; }
  .drawer-meta { grid-template-columns: 1fr; }
}
</style>
