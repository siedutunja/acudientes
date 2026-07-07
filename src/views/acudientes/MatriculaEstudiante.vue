<template>
  <div class="mat-page">

    <button class="btn-volver" @click="volver">← Regresar al menú</button>

    <!-- ══ ENCABEZADO FICHA ══════════════════════════════════════════ -->
    <div class="ficha-header" v-if="studentSummary.nombre">
      <div class="ficha-header-stripe"></div>
      <div class="ficha-header-body">

        <div class="ficha-foto-wrap">
          <img v-if="studentSummary.foto" :src="studentSummary.foto" alt="Foto" class="ficha-foto">
          <div v-else class="ficha-foto-placeholder">{{ iniciales }}</div>
        </div>

        <div class="ficha-identidad">
          <p class="ficha-label-top">Ficha de matrícula institucional</p>
          <h1 class="ficha-nombre">{{ studentSummary.nombre }}</h1>
          <p class="ficha-doc">{{ studentSummary.tipodocumento }} {{ studentSummary.documento }}</p>

          <div class="ficha-chips" v-if="matriculaDisponible">
            <span class="ficha-chip">
              <span class="chip-label">Vigencia</span>
              <span class="chip-val">{{ matricula.vigencia || '-' }}</span>
            </span>
            <span class="ficha-chip">
              <span class="chip-label">Sede</span>
              <span class="chip-val">{{ matricula.sede || '-' }}</span>
            </span>
            <span class="ficha-chip">
              <span class="chip-label">Grado</span>
              <span class="chip-val">{{ matricula.grado || '-' }}</span>
            </span>
            <span class="ficha-chip">
              <span class="chip-label">Edad</span>
              <span class="chip-val">{{ edadEstudiante }}</span>
            </span>
          </div>
        </div>

        <div class="ficha-estado-wrap" v-if="matriculaDisponible">
          <span :class="['estado-pill', estadoClass]">{{ matricula.estado || 'SIN ESTADO' }}</span>
        </div>

      </div>
    </div>

    <!-- ══ ESTADOS ═══════════════════════════════════════════════════ -->
    <div class="estado-carga" v-if="loading">
      <div class="spinner"></div>
      <p>Cargando ficha de matrícula...</p>
    </div>

    <div class="estado-vacio" v-else-if="!matriculaDisponible && !loading">
      <p class="vacio-titulo">Sin información de matrícula</p>
      <p>No se encontró matrícula registrada para este estudiante.</p>
    </div>

    <!-- ══ SECCIONES ═════════════════════════════════════════════════ -->
    <template v-else>

      <!-- 1. Datos de la matrícula -->
      <div class="seccion-card">
        <div class="seccion-header azul">
          <h2>Datos de la matrícula</h2>
        </div>
        <div class="seccion-grid col3">
          <div class="dato"><span>Vigencia</span><strong>{{ matricula.vigencia || '-' }}</strong></div>
          <div class="dato"><span>Estado</span>
            <strong>
              <span :class="['estado-inline', estadoClass]">{{ matricula.estado || '-' }}</span>
            </strong>
          </div>
          <div class="dato"><span>Fecha de matrícula</span><strong>{{ asDate(matricula.creado) }}</strong></div>
          <div class="dato"><span>Sede</span><strong>{{ matricula.sede || '-' }}</strong></div>
          <div class="dato"><span>Grado</span><strong>{{ matricula.grado || '-' }}</strong></div>
          <div class="dato"><span>Curso</span><strong>{{ matricula.curso || matricula.nomenclatura || '-' }}</strong></div>
          <div class="dato"><span>Jornada</span><strong>{{ matricula.jornada || '-' }}</strong></div>
          <div class="dato"><span>Metodología</span><strong>{{ matricula.metodologia || '-' }}</strong></div>
          <div class="dato"><span>Especialidad</span><strong>{{ matricula.especialidad || '-' }}</strong></div>
        </div>
        <div class="divisor"></div>
        <div class="seccion-grid col4 mt-sm">
          <div class="dato-flag">
            <span class="flag-label">Nuevo</span>
            <span :class="['flag-val', matricula.id_nuevo | siNoBool(matricula.id_nuevo) ? 'flag-si' : 'flag-no']">
              {{ siNoLabel(matricula.id_nuevo) }}
            </span>
          </div>
          <div class="dato-flag">
            <span class="flag-label">Repitente</span>
            <span :class="['flag-val', siNoBool(matricula.id_repitente) ? 'flag-si' : 'flag-no']">
              {{ siNoLabel(matricula.id_repitente) }}
            </span>
          </div>
          <div class="dato-flag">
            <span class="flag-label">Inc. diversa</span>
            <span :class="['flag-val', siNoBool(matricula.id_diversa) ? 'flag-si' : 'flag-no']">
              {{ siNoLabel(matricula.id_diversa) }}
            </span>
          </div>
          <div class="dato-flag">
            <span class="flag-label">Conceptual</span>
            <span :class="['flag-val', siNoBool(matricula.id_conceptual) ? 'flag-si' : 'flag-no']">
              {{ siNoLabel(matricula.id_conceptual) }}
            </span>
          </div>
          <div class="dato-flag">
            <span class="flag-label">Prematrícula</span>
            <span :class="['flag-val', siNoBool(matricula.prematricula) ? 'flag-si' : 'flag-no']">
              {{ siNoLabel(matricula.prematricula) }}
            </span>
          </div>
          <div class="dato-flag">
            <span class="flag-label">Renovado</span>
            <span :class="['flag-val', siNoBool(matricula.renovado) ? 'flag-si' : 'flag-no']">
              {{ siNoLabel(matricula.renovado) }}
            </span>
          </div>
          <div class="dato-flag">
            <span class="flag-label">Ruta escolar</span>
            <span class="flag-val flag-neutro">{{ matricula.id_ruta || '-' }}</span>
          </div>
          <div class="dato-flag">
            <span class="flag-label">Procedencia</span>
            <span class="flag-val flag-neutro">{{ matricula.procedencia || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Datos del estudiante -->
      <div class="seccion-card">
        <div class="seccion-header verde">
          <h2>Datos del estudiante</h2>
        </div>
        <div class="seccion-grid col3">
          <div class="dato"><span>Tipo de documento</span><strong>{{ matricula.tipodocumento || matricula.tipodoc || studentSummary.tipodocumento || '-' }}</strong></div>
          <div class="dato"><span>Número de documento</span><strong>{{ matricula.documento || studentSummary.documento || '-' }}</strong></div>
          <div class="dato"><span>Fecha de nacimiento</span><strong>{{ asDate(matricula.fechaNace) }}</strong></div>
          <div class="dato"><span>Edad</span><strong>{{ edadEstudiante }}</strong></div>
          <div class="dato"><span>Género</span><strong>{{ matricula.genero || '-' }}</strong></div>
          <div class="dato"><span>Nacionalidad</span><strong>{{ matricula.pais || '-' }}</strong></div>
          <div class="dato"><span>Municipio de nacimiento</span><strong>{{ matricula.municipioNac || '-' }}</strong></div>
        </div>
      </div>

      <!-- 3. Condición especial -->
      <div class="seccion-card">
        <div class="seccion-header teal">
          <h2>Condición especial</h2>
        </div>
        <div class="seccion-grid col2">
          <div class="dato">
            <span>Categoría de discapacidad</span>
            <strong>{{ matricula.categoriaDiscapacidad || 'No aplica' }}</strong>
          </div>
          <div class="dato">
            <span>Discapacidad</span>
            <strong>{{ matricula.discapacidad || 'No aplica' }}</strong>
          </div>
          <div class="dato">
            <span>Capacidades o talentos excepcionales</span>
            <strong>{{ matricula.capacidad || 'No aplica' }}</strong>
          </div>
          <div class="dato">
            <span>Trastorno</span>
            <strong>{{ matricula.trastorno || 'No aplica' }}</strong>
          </div>
          <div class="dato">
            <span>Tipo de apoyo</span>
            <strong>{{ matricula.apoyo || 'No aplica' }}</strong>
          </div>
          <div class="dato">
            <span>Víctima del conflicto</span>
            <strong>{{ matricula.victima || 'No aplica' }}</strong>
          </div>
        </div>
      </div>

      <!-- 4. Datos de contacto -->
      <div class="seccion-card">
        <div class="seccion-header naranja">
          <h2>Datos de contacto</h2>
        </div>
        <div class="seccion-grid col3">
          <div class="dato" style="grid-column: span 2"><span>Dirección de residencia</span><strong>{{ matricula.direccion || '-' }}</strong></div>
          <div class="dato"><span>Municipio</span><strong>{{ matricula.municipioDir || '-' }}</strong></div>
          <div class="dato"><span>Teléfono 1</span><strong>{{ matricula.telefono1 || '-' }}</strong></div>
          <div class="dato"><span>Teléfono 2</span><strong>{{ matricula.telefono2 || '-' }}</strong></div>
          <div class="dato"><span>Correo electrónico</span><strong>{{ matricula.correo || '-' }}</strong></div>
        </div>
      </div>

      <!-- 4. Acudiente y familia -->
      <div class="seccion-card">
        <div class="seccion-header morado">
          <h2>Acudiente y familia</h2>
        </div>
        <div class="seccion-subgrupo">
          <p class="subgrupo-titulo">Acudiente Responsable</p>
          <div class="seccion-grid col3">
            <div class="dato" style="grid-column: span 2"><span>Nombre del acudiente</span><strong>{{ matricula.acudiente || '-' }}</strong></div>
            <div class="dato"><span>Parentesco</span><strong>{{ matricula.parentesco || '-' }}</strong></div>
            <div class="dato"><span>Teléfono</span><strong>{{ matricula.telefonoA || '-' }}</strong></div>
            <div class="dato" style="grid-column: span 2"><span>Dirección</span><strong>{{ matricula.direccionA || '-' }}</strong></div>
            <div class="dato"><span>Correo</span><strong>{{ matricula.correoA || '-' }}</strong></div>
          </div>
        </div>
        <div class="divisor"></div>
        <div class="seccion-subgrupo">
          <p class="subgrupo-titulo">Datos familiares</p>
          <div class="seccion-grid col2">
            <div class="dato"><span>Nombre del padre</span><strong>{{ matricula.padre || '-' }}</strong></div>
            <div class="dato"><span>Teléfono del padre</span><strong>{{ matricula.telefonoP || '-' }}</strong></div>
            <div class="dato"><span>Nombre de la madre</span><strong>{{ matricula.madre || '-' }}</strong></div>
            <div class="dato"><span>Teléfono de la madre</span><strong>{{ matricula.telefonoM || '-' }}</strong></div>
          </div>
        </div>
      </div>

      <!-- 5. Observaciones y trazabilidad -->
      <div class="seccion-card">
        <div class="seccion-header gris">
          <h2>Observaciones y trazabilidad</h2>
        </div>
        <div class="seccion-grid col2" v-if="matricula.obs_matricula || matricula.obs_final">
          <div class="dato-obs" v-if="matricula.obs_matricula" style="grid-column: span 2">
            <span>Observaciones de matrícula</span>
            <p>{{ matricula.obs_matricula }}</p>
          </div>
          <div class="dato-obs" v-if="matricula.obs_final" style="grid-column: span 2">
            <span>Observaciones finales</span>
            <p>{{ matricula.obs_final }}</p>
          </div>
        </div>
        <div class="seccion-grid col3">
          <div class="dato"><span>Fecha obs. de comisión</span><strong>{{ asDate(matricula.fecha_obs_comision) }}</strong></div>
          <div class="dato"><span>Última actualización</span><strong>{{ asDate(matricula.actualizado) }}</strong></div>
        </div>
        <div class="divisor"></div>
        <div class="ids-row">
          <div class="id-item">
            <span>ID estudiante</span>
            <code>{{ matricula.id_estudiante || '-' }}</code>
          </div>
          <div class="id-item">
            <span>ID matrícula</span>
            <code>{{ matricula.id_matricula || matricula.id || '-' }}</code>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script>
import axios from 'axios'
import * as CONFIG from '@/assets/config.js'

export default {
  name: 'MatriculaEstudiante',
  data () {
    return {
      loading: false,
      matricula: {},
      studentSummary: {
        nombre: '',
        tipodocumento: '',
        documento: '',
        foto: ''
      }
    }
  },
  computed: {
    iniciales () {
      return this.studentSummary.nombre
        .split(' ').filter(Boolean).slice(0, 2)
        .map(p => p[0]).join('').toUpperCase()
    },
    matriculaDisponible () {
      return Boolean(this.matricula && (this.matricula.id_matricula || this.matricula.id))
    },
    estadoClass () {
      const e = String(this.matricula.estado || '').toUpperCase()
      if (e.includes('CURSO') || e.includes('ACTIVO')) return 'estado-activo'
      if (e.includes('RETIRADO')) return 'estado-retirado'
      return 'estado-otro'
    },
    edadEstudiante () {
      if (!this.matricula.fechaNace) return '-'
      const nac = new Date(this.matricula.fechaNace)
      if (isNaN(nac.getTime())) return '-'
      const hoy = new Date()
      let edad = hoy.getFullYear() - nac.getFullYear()
      const m = hoy.getMonth() - nac.getMonth()
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
      return `${edad} años`
    }
  },
  methods: {
    asDate (value) {
      if (!value) return '-'
      const raw = String(value).substring(0, 10)
      const [y, mo, d] = raw.split('-')
      if (!y || !mo || !d) return String(value).substring(0, 10)
      return `${d}/${mo}/${y}`
    },
    siNoLabel (value) {
      const v = String(value === undefined || value === null ? '' : value).trim().toUpperCase()
      if (v === 'S' || v === 'SI' || v === 'Y' || v === '1') return 'SÍ'
      if (v === 'N' || v === 'NO' || v === '0') return 'NO'
      return v || '-'
    },
    siNoBool (value) {
      const v = String(value === undefined || value === null ? '' : value).trim().toUpperCase()
      return v === 'S' || v === 'SI' || v === 'Y' || v === '1'
    },
    volver () {
      const idMatricula = this.$route.params.idMatricula || ''
      this.$router.push({ name: 'menu-estudiante', params: { idMatricula } })
    },
    async cargarMatricula (estudianteSeleccionado) {
      const idMatricula = this.$route.params.idMatricula || estudianteSeleccionado.idMatricula

      this.loading = true
      try {
        const { data } = await axios.get(CONFIG.ROOT_PATH + 'acudientes/matricula/estudiante', {
          params: {
            idMatricula,
            _t: Date.now()
          },
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
          timeout: 20000
        })

        if (data && !data.error && data.datos) {
          this.matricula = {
            ...data.datos,
            id_matricula: data.datos.id_matricula || data.datos.id || idMatricula,
            curso: data.datos.curso || data.datos.nomenclatura || ''
          }
          this.studentSummary = {
            nombre: data.datos.estudiante || estudianteSeleccionado.estudiante || '',
            tipodocumento: data.datos.tipodocumento || data.datos.tipodoc || estudianteSeleccionado.tipodocumento || '',
            documento: data.datos.documento || estudianteSeleccionado.documento || '',
            foto: data.datos.foto || estudianteSeleccionado.foto || ''
          }
          return
        }
        this.matricula = {}
      } catch {
        this.$bvToast.toast('Error consultando información de matrícula.', {
          title: CONFIG.TITULO_MSG, variant: 'danger',
          toaster: 'b-toaster-top-center', solid: true, autoHideDelay: 3000
        })
        this.matricula = {}
      } finally {
        this.loading = false
      }
    }
  },
  beforeMount () {
    const idMatricula = this.$route.params.idMatricula || ''
    const raw = sessionStorage.getItem('acudienteEstudiantes')
    const lista = raw ? JSON.parse(raw) : []
    const est = lista.find(x => String(x.idMatricula) === String(idMatricula)) || null

    if (!est || !idMatricula) {
      this.$bvToast.toast('Debes seleccionar primero un estudiante para consultar la matrícula.', {
        title: 'Módulo Acudiente', variant: 'warning',
        toaster: 'b-toaster-top-center', solid: true, autoHideDelay: 2800
      })
      this.$router.replace({ name: 'inicio-acudiente' })
      return
    }

    this.studentSummary = {
      nombre: est.estudiante || '',
      tipodocumento: est.tipodocumento || '',
      documento: est.documento || '',
      foto: est.foto || ''
    }

    this.cargarMatricula(est)
  }
}
</script>

<style scoped>
/* ── Página ───────────────────────────────────────────────────────── */
.mat-page {
  padding: 1rem 1.25rem 2rem;
  background: #eef1f7;
  min-height: 100vh;
  font-family: inherit;
  color: #1a2535;
}

/* ── Botón volver ─────────────────────────────────────────────────── */
.btn-volver {
  border: 1.5px solid #1a3a6b;
  background: transparent;
  color: #1a3a6b;
  border-radius: 8px;
  padding: 0.4rem 1rem;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1.1rem;
  display: inline-block;
  transition: background 0.15s, color 0.15s;
}
.btn-volver:hover { background: #1a3a6b; color: #fff; }

/* ── Encabezado ficha ─────────────────────────────────────────────── */
.ficha-header {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(10, 30, 70, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
}

.ficha-header-stripe {
  height: 6px;
  background: linear-gradient(90deg, #1a3a6b 0%, #c8a415 60%, #1a3a6b 100%);
}

.ficha-header-body {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  align-items: center;
}

.ficha-foto-wrap { display: flex; align-items: center; justify-content: center; }

.ficha-foto {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #1a3a6b;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.ficha-foto-placeholder {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a3a6b, #3d6ea8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.ficha-label-top {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #c8a415;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.ficha-nombre {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a3a6b;
  margin: 0 0 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.ficha-doc {
  font-size: 0.8rem;
  color: #6b7f9a;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.ficha-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.ficha-chip {
  background: #f0f4fb;
  border: 1px solid #cdd8ea;
  border-radius: 8px;
  padding: 0.3rem 0.65rem;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
}

.chip-label {
  font-size: 0.62rem;
  text-transform: uppercase;
  color: #8a9bb0;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.chip-val {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1a3a6b;
}

.ficha-estado-wrap {
  display: flex;
  align-items: flex-start;
  padding-top: 0.25rem;
}

/* ── Píldoras de estado ───────────────────────────────────────────── */
.estado-pill {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.estado-activo  { background: #d4edda; color: #1a6335; border: 1px solid #a8d5b5; }
.estado-retirado{ background: #f8d7da; color: #842029; border: 1px solid #f1aeb5; }
.estado-otro    { background: #e9ecef; color: #495057; border: 1px solid #ced4da; }

.estado-inline {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

/* ── Estado carga / vacío ─────────────────────────────────────────── */
.estado-carga {
  background: #fff;
  border-radius: 14px;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7f9a;
  box-shadow: 0 4px 18px rgba(10,30,70,0.08);
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #dce5f0;
  border-top-color: #1a3a6b;
  border-radius: 50%;
  animation: girar 0.8s linear infinite;
  margin: 0 auto 0.75rem;
}
@keyframes girar { to { transform: rotate(360deg); } }

.estado-vacio {
  background: #fff;
  border-radius: 14px;
  padding: 2.5rem 1rem;
  text-align: center;
  color: #6b7f9a;
  box-shadow: 0 4px 18px rgba(10,30,70,0.08);
}
.vacio-titulo { font-size: 1rem; font-weight: 700; color: #1a3a6b; margin-bottom: 0.25rem; }

/* ── Sección card ─────────────────────────────────────────────────── */
.seccion-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(10, 30, 70, 0.07);
  margin-bottom: 1rem;
  overflow: hidden;
}

.seccion-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1.4rem;
  border-left: 5px solid transparent;
}

.seccion-header h2 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.seccion-header.azul    { background: #f0f4fc; border-color: #1a3a6b; color: #1a3a6b; }
.seccion-header.verde   { background: #f0faf4; border-color: #1a6335; color: #1a6335; }
.seccion-header.naranja { background: #fff8f0; border-color: #c05a00; color: #c05a00; }
.seccion-header.morado  { background: #f6f0fc; border-color: #5a2d82; color: #5a2d82; }
.seccion-header.gris    { background: #f4f5f7; border-color: #6b7f9a; color: #4a5568; }
.seccion-header.teal    { background: #e6f7f5; border-color: #2c9c8a; color: #1a6e61; }

/* ── Grids de datos ───────────────────────────────────────────────── */
.seccion-grid {
  padding: 1rem 1.4rem;
  display: grid;
  gap: 0.75rem 1.25rem;
}

.col3 { grid-template-columns: repeat(3, minmax(160px, 1fr)); }
.col2 { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
.col4 { grid-template-columns: repeat(4, minmax(120px, 1fr)); }
.mt-sm { padding-top: 0.5rem; }

.dato {
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8edf5;
}

.dato span {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8a9bb0;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.dato strong {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a2535;
  display: block;
  line-height: 1.3;
}

/* ── Flags SÍ/NO ──────────────────────────────────────────────────── */
.dato-flag {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 0.55rem 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8edf5;
}

.flag-label {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8a9bb0;
  font-weight: 600;
  text-align: center;
}

.flag-val {
  font-size: 0.78rem;
  font-weight: 800;
  border-radius: 6px;
  padding: 0.15rem 0.6rem;
  text-align: center;
}

.flag-si    { background: #d4edda; color: #1a6335; }
.flag-no    { background: #e9ecef; color: #6b7284; }
.flag-neutro{ background: #e8f0fb; color: #1a3a6b; font-weight: 600; font-size: 0.8rem; }

/* ── Sub-grupos acudiente ─────────────────────────────────────────── */
.seccion-subgrupo { padding: 0.75rem 1.4rem 0; }

.subgrupo-titulo {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: #8a9bb0;
  margin: 0 0 0.6rem;
  padding-bottom: 0.3rem;
  border-bottom: 1px dashed #dce5f0;
}

/* ── Divisor ──────────────────────────────────────────────────────── */
.divisor {
  height: 1px;
  background: linear-gradient(90deg, transparent, #dce5f0 20%, #dce5f0 80%, transparent);
  margin: 0 1.4rem;
}

/* ── Observaciones texto ──────────────────────────────────────────── */
.dato-obs {
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8edf5;
  border-left: 3px solid #1a3a6b;
}

.dato-obs span {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8a9bb0;
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.dato-obs p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: #1a2535;
}

/* ── IDs fila ─────────────────────────────────────────────────────── */
.ids-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem 1.4rem 1rem;
}

.id-item span {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8a9bb0;
  font-weight: 600;
  margin-bottom: 0.2rem;
}

.id-item code {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.78rem;
  background: #f0f4fb;
  color: #2a4e7a;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  border: 1px solid #cdd8ea;
  display: inline-block;
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .col3 { grid-template-columns: repeat(2, 1fr); }
  .col4 { grid-template-columns: repeat(2, 1fr); }
  .ficha-header-body { grid-template-columns: 80px 1fr; }
  .ficha-estado-wrap { grid-column: span 2; justify-self: start; }
}

@media (max-width: 560px) {
  .col3, .col2, .col4 { grid-template-columns: 1fr; }
  .dato[style], .dato-obs[style] { grid-column: span 1 !important; }
  .ficha-header-body { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .ficha-chips { justify-content: center; }
  .ficha-estado-wrap { grid-column: span 1; }
}
</style>
