<template>
  <div class="flex-row align-items-center pt-5">
    <CContainer>
      <CRow class="justify-content-center" v-if="sinToken==false">
        <CCol md="4">
          <CCardGroup>
            <CCard class="p-4">
              <CCardBody>
                <b-form @submit.stop.prevent="validarCampos">
                  <div class="text-center"><img :src="this.escudoColegio" height="60" class="mr-2"/></div>
                  <div class="small text-muted text-medium-emphasis text-center">{{ this.categoriaColegio }}</div>
                  <div class="small text-muted text-medium-emphasis text-center">{{ this.nombreColegio }}</div>
                  <div class="small text-muted text-medium-emphasis text-center">Año Lectivo: {{ this.aLectivoColegio }}</div>
                  <hr class="mt-4">
                  <h5 class="text-muted">Iniciar Sesión</h5>
                  <b-input-group>
                    <template #prepend>
                      <b-input-group-text><CIcon name="cil-list"/></b-input-group-text>
                    </template>
                    <b-form-select v-model="idTipoUsuario" :options="tiposUsuarios" @change="activarCampos"></b-form-select>
                  </b-input-group>
                  <b-input-group class="mt-3">
                    <template #prepend>
                      <b-input-group-text><CIcon name="cil-user"/></b-input-group-text>
                    </template>
                    <b-form-input type="text" v-model.trim="usuario" placeholder="Usuario" @change="activarUsuario" ref="usuario" :disabled="campoDesactivado"></b-form-input>
                  </b-input-group>
                  <span class="text-left text-danger">{{msjUsuario}}</span>
                  <b-input-group class="mt-3">
                    <template #prepend>
                      <b-input-group-text><CIcon name="cil-lock-locked"/></b-input-group-text>
                    </template>
                    <b-form-input type="password" v-model.trim="clave" placeholder="Contraseña" @change="activarClave" ref="clave" :disabled="campoDesactivado"></b-form-input>
                  </b-input-group>
                  <span class="text-left text-danger">{{msjClave}}</span>
                  <b-button type="submit" class="btn mb-2 mt-4 btn-block" variant="primary" :disabled="campoDesactivado">Iniciar Sesión</b-button>
                  <b-button class="float-right text-info mt-3" variant="link" @click="restaurarClave"><small><em>Recuperar mi contraseña</em></small></b-button>
                </b-form>
              </CCardBody>
              <CCardFooter>
                <div class="text-center"><img src="logo_n.png" height="25" class="mr-2"/></div>
              </CCardFooter>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<script>
  import axios from "axios"
  import * as CONFIG from '@/assets/config.js'
  import jwt from 'jsonwebtoken'

  export default {
    name: 'Login',
    data () {
      return {
        idTipoUsuario: 0,
        usuario: '',
        clave: '',
        msjUsuario: '',
        msjClave: '',
        idColegio: null,
        nombreColegio: null,
        categoriaColegio: null,
        bdColegio: null,
        escudoColegio: null,
        aLectivoColegio: 0,
        tiposUsuarios: [
          { value: 0, text: 'Tipo Usuario'},
          { value: 1, text: 'Estudiante'},
          //{ value: 2, text: 'Docente'},
          //{ value: 3, text: 'Administrativo'}
        ],
        campoDesactivado: true,
        sinToken: false,
        datosUsuario: { 
          idMatricula: null,
          idEstudiante: null,
          usuario: null,
          clave: null,
          aLectivo: null,
          idColegio: null,
          bdColegio: null
        }
      }
    },
    methods: {
      validarTipoUsuario() {
        if (this.idTipoUsuario == 1) {
          this.validarSesionEstudiante()
        } else if (this.idTipoUsuario == 2) {
          this.mensajeEmergente('success',CONFIG.TITULO_MSG,'El Tipo de Usuario seleccionado es Docente.')
        } else if (this.idTipoUsuario == 3) {
          this.mensajeEmergente('success',CONFIG.TITULO_MSG,'El Tipo de Usuario seleccionado es Administrativo.')
        } else {
          this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Seleccione el Tipo de Usuario con el que va a iniciar sesión.')
        }
      },
      async validarSesionEstudiante() {
        await axios
        .get(CONFIG.ROOT_PATH + 'login/estudiante', { params: { bdColegio: this.bdColegio, aLectivo: this.aLectivoColegio, idMatricula: this.usuario }})
        .then(response => {
          if (response.data.error){
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,response.data.mensaje + ' - Consulta Usuario Login')
          } else{
            if (response.data.datos != 0) {
              if (response.data.datos.id_estado == 1) {
                if (response.data.datos.clave == this.clave) {
                  this.datosUsuario.idMatricula = response.data.datos.id_matricula
                  this.datosUsuario.idEstudiante = response.data.datos.id_estudiante
                  this.datosUsuario.usuario = this.usuario
                  this.datosUsuario.clave = this.clave
                  this.datosUsuario.aLectivo = this.aLectivoColegio
                  this.datosUsuario.idColegio = this.idColegio
                  this.datosUsuario.bdColegio = this.bdColegio
                  console.log(JSON.stringify(this.datosUsuario))
                  //this.trazabilidadSesion()
                  let token = jwt.sign(this.datosUsuario, CONFIG.SECRET_KEY, {expiresIn: '14400s'})
                  location.replace(CONFIG.ROOT_MODULO_ESTUDIANTE + '/?token=' + token)
                } else {
                  this.clave = ''
                  this.$refs.clave.focus()
                  this.mensajeEmergente('warning',CONFIG.TITULO_MSG,'¡Ups!. La contraseña esta errada., verifique e intente nuevamente.')
                }
              } else {
                this.usuario = ''
                this.clave = ''
                this.$refs.usuario.focus()
                this.mensajeEmergente('info',CONFIG.TITULO_MSG,'¡Lo sentimos!. Actualmente el Estudiante no se encuentra activo en la Institución Educativa, verifique e intente nuevamente.')
              }
            } else {
              this.usuario = ''
              this.clave = ''
              this.$refs.usuario.focus()
              this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'¡Uy!. El Estudiante no se encuentra registrado en la Institución Educativa, verifique e intente nuevamente.')
            }
          }
        })
        .catch(err => {
          if (err == 'Error: Network Error') {
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Lo sentimos, se detecto un problema al conectarse con el servidor. (Certificado)')
          } else {
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Algo salio mal y no se pudo realizar: Consulta Usuario Login. Intente más tarde. ' + err)
          }
        })
      },
      async trazabilidadSesion() {
        let traza = { idUsuario: this.datosUsuario.id, ip: null}
        await axios
        .post(CONFIG.ROOT_PATH + 'login/trazabilidad', JSON.stringify(traza), { headers: {"Content-Type": "application/json; charset=utf-8" }})
        .then(response => {
          if (response.data.error){
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,response.data.mensaje + ' - Trazabilidad Sesión del Usuario')
          }
        })
        .catch(err => {
          this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Algo salio mal y no se pudo realizar: Trazabilidad Sesión del Usuario. Intente más tarde. ' + err)
        })
      },
      restaurarClave() {
        this.$router.push('./recuperaclave')
      },
      activarUsuario() {
        this.msjUsuario = ''
      },
      activarClave() {
        this.msjClave = ''
      },
      activarCampos() {
        this.campoDesactivado = this.idTipoUsuario == 0 ? true : false
      },
      validarCampos() {
        if (this.usuario == '') {
          this.msjUsuario = 'Digite el usuario'
          this.$refs.usuario.focus()
        } else if (this.clave == '') {
          this.msjClave = 'Digite la contraseña'
          this.$refs.clave.focus()
        } else {
          this.validarTipoUsuario()
        }
      },
      async iniciarVista(){
        if ( this.idColegio === null ) {
          let valores = window.location.search
          let urlParams = new URLSearchParams(valores)
          this.idColegio = urlParams.get('id')
          sessionStorage.setItem('token', this.idColegio)
          window.history.replaceState({},'','/login/')
        }
        await axios
        .get(CONFIG.ROOT_PATH + 'colegios/infobasica', { params: { idColegio: this.idColegio }})
        .then(response => {
          if (response.data.error){
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,response.data.mensaje + ' - Información básica del Colegio')
          } else{
            if (response.data.datos != 0) {
              this.nombreColegio = response.data.datos.nombre
              this.categoriaColegio = response.data.datos.categoria
              this.bdColegio = response.data.datos.bd
              this.escudoColegio = CONFIG.ROOT_ESCUDOS + 'es' + this.idColegio + '.jpg'
              this.consultaConfiguraciones()
            } else {
              this.sinToken = true
              this.mensajeFinal()
            }
          }
        })
        .catch(err => {
          this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Algo salio mal y no se pudo realizar: Información básica del Colegio. Intente más tarde.' + err)
        })
      },
      async consultaConfiguraciones() {
        await axios
        .get(CONFIG.ROOT_PATH + 'configuraciones/alectivo', { params: { bdColegio: this.bdColegio }})
        .then(response => {
          if (response.data.error){
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,response.data.mensaje + ' - Información configuraciones del Colegio')
          } else{
            if (response.data.datos != 0) {
              this.aLectivoColegio = response.data.datos.a_lectivo
            }
          }
        })
        .catch(err => {
          this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Algo salio mal y no se pudo realizar: Información configuraciones del Colegio. Intente más tarde.' + err)
        })
      },
      mensajeFinal() {
        this.boxTwo = ''
        this.$bvModal.msgBoxOk('Lo sentimos. El token de ingreso no es válido. Verifique el Link que le suministraron para ingresar a la plataforma y vueva a intentarlo.', {
          title: CONFIG.TITULO_MSG,
          size: 'sm',
          buttonSize: 'sm',
          okVariant: 'primary',
          headerClass: 'p-2 border-bottom-0',
          footerClass: 'p-2 border-top-0',
          centered: true
        })
          .then(value => {
            this.sinToken = value //true
          })
      },
      mensajeEmergente(variante, titulo, contenido) {
        this.$bvToast.toast(contenido, { title: titulo, variant: variante, toaster: "b-toaster-top-center", solid: true, autoHideDelay: 4000, appendToast: false })
      }
    },
    beforeMount() {
      this.idColegio = sessionStorage.getItem('token')
      this.iniciarVista()
    }
  }
</script>