<template>
  <div class="p-2 p-md-3">
    <CContainer fluid>
      <div class="portal-header-card mb-4" v-if="acudiente">
        <div class="portal-header-logo">
          <img src="escudo-tunja.png" alt="Escudo" class="portal-escudo">
        </div>
        <div class="portal-header-body">
          <div class="portal-header-tag">PORTAL DE ACOMPAÑAMIENTO FAMILIAR</div>
          <h3 class="portal-header-name">{{ acudiente.acudiente || '-' }}</h3>
          <div class="portal-header-meta">
            <span><b>Doc:</b> {{ acudiente.documento || '-' }}</span>
            <span v-if="acudiente.telefono && acudiente.telefono.trim()"><b>Tel:</b> {{ acudiente.telefono.trim() }}</span>
            <span v-if="acudiente.correo"><b>Correo:</b> {{ acudiente.correo }}</span>
          </div>
          <div class="portal-header-pills">
            <span class="portal-pill">Año lectivo: {{ acudiente.vigencia || '-' }}</span>
            <span class="portal-pill portal-pill-alt">{{ totalEstudiantes }} estudiante(s) a cargo</span>
          </div>
        </div>
      </div>

      <CCard>
        <CCardHeader>
          <strong>Seleccione un estudiante a su cargo</strong>
        </CCardHeader>
        <CCardBody>
          <div v-if="cargando" class="text-center py-4">
            <b-spinner variant="primary" label="Cargando"></b-spinner>
            <div class="text-muted mt-2">Consultando información...</div>
          </div>

          <div v-else-if="!estudiantes.length" class="text-muted">
            No hay estudiantes activos asociados para la vigencia actual.
          </div>

          <div v-else>
            <CRow>
              <CCol cols="12" md="6" lg="4" v-for="(est, idx) in estudiantes" :key="idx" class="mb-3">
                <CCard class="h-100 card-estudiante shadow-sm">
                  <CCardHeader class="card-estudiante-header d-flex align-items-center justify-content-between" @click="abrirMenuEstudiante(est)">
                    <div class="font-weight-bold text-uppercase text-truncate pr-2">{{ est.estudiante || '-' }}</div>
                    <CIcon name="cil-user" height="14"/>
                  </CCardHeader>
                  <CCardBody class="pt-4" @click="abrirMenuEstudiante(est)">
                    <div class="text-center mb-3">
                      <img v-if="est.foto" :src="est.foto" alt="Foto estudiante" class="student-photo">
                      <div v-else class="student-photo student-photo-fallback d-inline-flex align-items-center justify-content-center">
                        <CIcon name="cil-user" height="34" class="text-muted"/>
                      </div>
                    </div>

                    <div class="small text-muted mb-1">{{ est.tipodocumento || '-' }} {{ est.documento || '-' }}</div>
                    <div class="small text-muted mb-1">Nacimiento: {{ est.fecha_nacimiento || '-' }} | Edad: {{ est.edad || '-' }}</div>
                    <div class="small text-muted mb-1">{{ est.genero || '-' }} | RH: {{ est.rh || '-' }} | Sisbén: {{ est.sisben || '-' }}</div>
                    <div class="small text-muted mb-1">{{ est.sede || '-' }} - {{ est.grado || '-' }} - {{ est.curso || '-' }}</div>
                    <div class="small text-muted mb-1">Jornada: {{ est.jornada || '-' }} | Especialidad: {{ est.especialidad || '-' }}</div>
                    <div class="small text-muted">Inclusión: {{ est.inclusion || '-' }} | Conceptual: {{ est.conceptual || '-' }}</div>
                    <div class="mt-3">
                      <b-button size="sm" variant="primary" @click.stop="abrirMenuEstudiante(est)">Ingresar al menú del estudiante</b-button>
                    </div>
                  </CCardBody>
                  <CCardFooter class="small text-muted py-2" @click="abrirMenuEstudiante(est)">
                    <em>Parentesco: {{ est.parentesco || '-' }}</em>
                  </CCardFooter>
                </CCard>
              </CCol>
            </CRow>
          </div>
        </CCardBody>
      </CCard>
    </CContainer>
  </div>
</template>

<script>
import axios from 'axios'
import * as CONFIG from '@/assets/config.js'

export default {
  name: 'PanelAcudiente',
  data () {
    return {
      token: '',
      acudiente: null,
      estudiantes: [],
      cargando: false
    }
  },
  computed: {
    totalEstudiantes() {
      return this.estudiantes.length
    }
  },
  methods: {
    obtenerToken() {
      const params = new URLSearchParams(window.location.search)
      return params.get('token') || ''
    },
    mensajeEmergente(variante, titulo, contenido) {
      this.$bvToast.toast(contenido, { title: titulo, variant: variante, toaster: 'b-toaster-top-center', solid: true, autoHideDelay: 4000, appendToast: false })
    },
    cerrarSesion() {
      sessionStorage.clear()
      location.replace(CONFIG.ROOT_HOME)
    },
    abrirMenuEstudiante(estudiante) {
      const idMatricula = estudiante.idMatricula || estudiante.id || ''
      if (!idMatricula) {
        this.mensajeEmergente('warning', CONFIG.TITULO_MSG, 'No se pudo identificar la matrícula del estudiante seleccionado.')
        return
      }
      this.$router.push({
        name: 'menu-estudiante',
        params: { idMatricula: String(idMatricula) },
        query: { doc: estudiante.documento || '' }
      })
    },
    async validarSesion() {
      if (!this.token) {
        this.mensajeEmergente('warning', CONFIG.TITULO_MSG, 'Sesión inválida. Ingrese nuevamente.')
        this.cerrarSesion()
        return
      }

      this.cargando = true
      try {
        const [sesionRes, estudiantesRes] = await Promise.all([
          axios.get(CONFIG.ROOT_PATH + 'acudientes/auth/session', { params: { token: this.token } }),
          axios.get(CONFIG.ROOT_PATH + 'acudientes/auth/estudiantes', { params: { token: this.token } })
        ])

        if (sesionRes.data.error) {
          this.mensajeEmergente('danger', CONFIG.TITULO_MSG, sesionRes.data.mensaje)
          this.cerrarSesion()
          return
        }

        this.acudiente = sesionRes.data.datos
        sessionStorage.setItem('acudienteNombre', this.acudiente.acudiente || 'Acudiente')
        sessionStorage.setItem('acudienteVigencia', String(this.acudiente.vigencia || ''))
        sessionStorage.setItem('acudienteIdInstitucion', String(this.acudiente.idInstitucion || ''))

        if (!estudiantesRes.data.error && estudiantesRes.data.datos && estudiantesRes.data.datos !== 0) {
          this.estudiantes = estudiantesRes.data.datos
          sessionStorage.setItem('acudienteEstudiantes', JSON.stringify(this.estudiantes))
        } else {
          this.estudiantes = []
          sessionStorage.removeItem('acudienteEstudiantes')
        }
      } catch (err) {
        this.mensajeEmergente('danger', CONFIG.TITULO_MSG, 'No se pudo cargar la información del acudiente. ' + err)
      } finally {
        this.cargando = false
      }
    }
  },
  beforeMount() {
    this.token = this.obtenerToken()
    if (this.token) {
      sessionStorage.setItem('token', this.token)
    } else {
      this.token = sessionStorage.getItem('token') || ''
    }
    this.validarSesion()
  }
}
</script>

<style scoped>
/* ── Header portal ── */
.portal-header-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0, 30, 70, 0.08);
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 1.25rem;
  padding: 1.25rem;
  border-left: 5px solid #1e4f8f;
}
.portal-header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
}
.portal-escudo { max-height: 88px; max-width: 88px; object-fit: contain; }
.portal-header-tag {
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: #6b89b0;
  margin-bottom: .35rem;
}
.portal-header-name {
  margin: 0 0 .2rem;
  color: #1e4f8f;
  font-size: 1.25rem;
  font-weight: 700;
}
.portal-header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: .9rem;
  font-size: .87rem;
  color: #4a5e72;
  margin-bottom: .7rem;
}
.portal-header-meta b { color: #24313f; }
.portal-header-pills { display: flex; flex-wrap: wrap; gap: .5rem; }
.portal-pill {
  display: inline-block;
  background: #e8f0fe;
  color: #1e4f8f;
  font-size: .78rem;
  font-weight: 600;
  padding: .22rem .75rem;
  border-radius: 999px;
}
.portal-pill-alt {
  background: #e6f4ea;
  color: #1f7f44;
}

/* ── Cards de estudiante ── */
.border-left-primary { border-left: 4px solid #2f74d0; }
.card-estudiante {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.card-estudiante:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}
.card-estudiante-header {
  background: #d8dde3;
  color: #2a2e33;
}
.student-photo {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  object-fit: cover;
  border: 2px solid #cfd6dd;
}
.student-photo-fallback { background: #eef2f6; }

@media (max-width: 768px) {
  .portal-header-card { grid-template-columns: 1fr; text-align: center; }
  .portal-header-meta { justify-content: center; }
  .portal-header-pills { justify-content: center; }
}
</style>
