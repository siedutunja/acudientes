<template>
  <div>
    <div class="mb-3">
      <b-button variant="outline-primary" @click="volverASeleccion">
        Regresar y escoger otro estudiante
      </b-button>
    </div>

    <div class="stu-summary-card mb-4">
      <div class="stu-photo-wrap">
        <img v-if="estudiante.foto" :src="estudiante.foto" alt="Foto" class="stu-photo">
        <div v-else class="stu-photo stu-photo-placeholder">Sin foto</div>
      </div>
      <div class="stu-content">
        <div class="stu-portal-tag">PORTAL DE ACOMPAÑAMIENTO FAMILIAR</div>
        <h3 class="stu-name">{{ estudiante.estudiante || '-' }}</h3>
        <p class="stu-doc">{{ estudiante.tipodocumento || '-' }} · {{ estudiante.documento || '-' }}</p>
        <div class="stu-grid">
          <div class="stu-item"><span>Institución</span><strong>{{ estudiante.nombreInstitucion || '-' }}</strong></div>
          <div class="stu-item"><span>Sede</span><strong>{{ estudiante.sede || '-' }}</strong></div>
          <div class="stu-item"><span>Grado</span><strong>{{ estudiante.grado || '-' }}</strong></div>
          <div class="stu-item"><span>Curso</span><strong>{{ estudiante.curso || '-' }}</strong></div>
          <div class="stu-item"><span>Jornada</span><strong>{{ estudiante.jornada || '-' }}</strong></div>
          <div class="stu-item"><span>Vigencia</span><strong>{{ vigencia }}</strong></div>
        </div>
      </div>
    </div>

    <CRow>
      <CCol cols="12" md="4" class="mb-3">
        <CCard class="h-100 option-card">
          <CCardBody class="text-center py-4 card-click-body" role="button" tabindex="0" @click="irHistoricoNotas" @keyup.enter="irHistoricoNotas">
            <CIcon name="cil-list-rich" height="42" class="mb-3 text-primary"/>
            <h5 class="mb-2">Consulta Notas</h5>
            <p class="text-muted mb-0">Consulta calificaciones y rendimiento académico.</p>
            <b-button size="sm" variant="primary" class="mt-3" @click.stop="irHistoricoNotas">Entrar</b-button>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol cols="12" md="4" class="mb-3">
        <CCard class="h-100 option-card">
          <CCardBody class="text-center py-4 card-click-body" role="button" tabindex="0" @click="irObservador" @keyup.enter="irObservador">
            <CIcon name="cil-description" height="42" class="mb-3 text-primary"/>
            <h5 class="mb-2">Consultar Observador</h5>
            <p class="text-muted mb-0">Revisa observaciones académicas y convivenciales.</p>
            <b-button size="sm" variant="primary" class="mt-3" @click.stop="irObservador">Entrar</b-button>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol cols="12" md="4" class="mb-3">
        <CCard class="h-100 option-card">
          <CCardBody class="text-center py-4 card-click-body" role="button" tabindex="0" @click="irMatricula" @keyup.enter="irMatricula">
            <CIcon name="cil-user-follow" height="42" class="mb-3 text-primary"/>
            <h5 class="mb-2">Consultar Matrícula</h5>
            <p class="text-muted mb-0">Verifica estado de matrícula y datos básicos.</p>
            <b-button size="sm" variant="primary" class="mt-3" @click.stop="irMatricula">Entrar</b-button>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  </div>
</template>

<script>
export default {
  name: 'MenuEstudiante',
  data () {
    return {
      estudiante: {},
      vigencia: ''
    }
  },
  methods: {
    volverASeleccion () {
      this.$router.push({ name: 'inicio-acudiente' })
    },
    irHistoricoNotas () {
      // Mapa de institución → ruta de notas.
      // Para agregar un nuevo colegio: añadir su id_institucion con { name, usaMatricula }.
      // usaMatricula: true  → pasa idMatricula como param de ruta
      // usaMatricula: false → ruta general sin param (ej. vista por curso como el INEM)
      const RUTAS_NOTAS_POR_INSTITUCION = {
        'eb58bf60-fc83-11ec-a1d1-1dc2835404e5': { name: 'consulta-notas-inem', usaMatricula: true  } // INEM Tunja
      }
      const RUTA_DEFAULT = { name: 'historico-notas-estudiante', usaMatricula: true }

      const idMatricula = this.$route.params.idMatricula || this.estudiante.idMatricula || this.estudiante.id
      if (!idMatricula) {
        this.$bvToast.toast('Primero selecciona un estudiante en el panel de acudiente.', {
          title: 'Módulo Acudiente',
          variant: 'warning',
          toaster: 'b-toaster-top-center',
          solid: true,
          autoHideDelay: 2500,
          appendToast: false
        })
        return
      }

      const rutaConfig = RUTAS_NOTAS_POR_INSTITUCION[this.estudiante.idInstitucion] || RUTA_DEFAULT
      const params = rutaConfig.usaMatricula ? { idMatricula: String(idMatricula) } : {}
      this.$router.push({ name: rutaConfig.name, params })
    },
    irObservador () {
      const idMatricula = this.$route.params.idMatricula || this.estudiante.idMatricula || this.estudiante.id
      if (!idMatricula) {
        this.$bvToast.toast('Primero selecciona un estudiante en el panel de acudiente.', {
          title: 'Módulo Acudiente',
          variant: 'warning',
          toaster: 'b-toaster-top-center',
          solid: true,
          autoHideDelay: 2500,
          appendToast: false
        })
        return
      }

      this.$router.push({
        name: 'observador-estudiante',
        params: { idMatricula: String(idMatricula) }
      })
    },
    irMatricula () {
      const idMatricula = this.$route.params.idMatricula || this.estudiante.idMatricula || this.estudiante.id
      if (!idMatricula) {
        this.$bvToast.toast('Primero selecciona un estudiante en el panel de acudiente.', {
          title: 'Módulo Acudiente',
          variant: 'warning',
          toaster: 'b-toaster-top-center',
          solid: true,
          autoHideDelay: 2500,
          appendToast: false
        })
        return
      }

      this.$router.push({
        name: 'matricula-estudiante',
        params: { idMatricula: String(idMatricula) }
      })
    },
    proximamente(modulo) {
      this.$bvToast.toast(`${modulo} estará disponible en la siguiente iteración.`, {
        title: 'Módulo Acudiente',
        variant: 'info',
        toaster: 'b-toaster-top-center',
        solid: true,
        autoHideDelay: 2500,
        appendToast: false
      })
    }
  },
  beforeMount() {
    const estudiantes = JSON.parse(sessionStorage.getItem('acudienteEstudiantes') || '[]')
    const idMatricula = this.$route.params.idMatricula
    const doc = this.$route.query.doc
    this.estudiante = estudiantes.find(x => String(x.idMatricula) === String(idMatricula)) || {}
    this.vigencia = sessionStorage.getItem('acudienteVigencia') || ''
  }
}
</script>

<style scoped>
/* ── Resumen estudiante ── */
.stu-summary-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0, 30, 70, 0.08);
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-left: 5px solid #1e4f8f;
}
.stu-photo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}
.stu-photo {
  width: 86px;
  height: 86px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #d4e1ef;
}
.stu-photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8eef5;
  color: #6b7a8a;
  font-size: .75rem;
}
.stu-portal-tag {
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  color: #6b89b0;
  margin-bottom: .3rem;
}
.stu-name {
  margin: 0 0 .15rem;
  color: #1e4f8f;
  font-size: 1.2rem;
  font-weight: 700;
}
.stu-doc {
  margin: 0 0 .75rem;
  color: #65788b;
  font-size: .88rem;
}
.stu-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(110px, 1fr));
  gap: .6rem;
}
.stu-item span { display: block; font-size: .72rem; color: #7b8a99; }
.stu-item strong { font-size: .88rem; color: #24313f; }

/* ── Opcion cards ── */
.option-card {
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.option-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}
.card-click-body { outline: none; }

/* ── Responsive ── */
@media (max-width: 1100px) {
  .stu-grid { grid-template-columns: repeat(3, minmax(100px, 1fr)); }
}
@media (max-width: 768px) {
  .stu-summary-card { grid-template-columns: 1fr; }
  .stu-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
