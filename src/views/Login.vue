<template>
  <div class="flex-row align-items-center pt-5">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol md="4">
          <CCardGroup>
            <CCard class="p-4">
              <CCardBody>
                <b-form @submit.stop.prevent="validarCampos">
                  <img src="escudo-tunja.png" height="45" class="float-left mr-2"/>
                  <h1>sieduTunja</h1>
                  <div class="small text-muted text-medium-emphasis float-right">
                    Login
                  </div>
                  <hr class="mt-4">
                  <h5 class="text-muted">Iniciar sesión en su cuenta</h5>
                  <b-input-group>
                    <template #prepend>
                      <b-input-group-text><CIcon name="cil-user"/></b-input-group-text>
                    </template>
                    <b-form-input type="text" v-model="usuario" placeholder="Usuario" @change="activarUsuario" ref="usuario"></b-form-input>
                  </b-input-group>
                  <span class="text-left text-danger">{{msjUsuario}}</span>
                  <b-input-group class="mt-3">
                    <template #prepend>
                      <b-input-group-text><CIcon name="cil-lock-locked"/></b-input-group-text>
                    </template>
                    <b-form-input type="password" v-model="clave" placeholder="Contraseña" @change="activarClave" ref="clave"></b-form-input>
                  </b-input-group>
                  <span class="text-left text-danger">{{msjClave}}</span>
                  <b-button type="submit" class="btn mb-2 mt-4 btn-block" variant="info">Iniciar Sesión</b-button>
                  <b-button class="float-right text-info mt-3" variant="link" @click="restaurarClave"><small><em>Recuperar mi contraseña</em></small></b-button>
                </b-form>
              </CCardBody>
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
        usuario: '',
        clave: '',
        msjUsuario: '',
        msjClave: '',
        datosUsuario: { 
          id: null, 
          usuario: null, 
          clave: null,
          id_entorno: null,
          estado: null,
          vigencia: null
        }
      }
    },
    methods: {
      async validarSesion() {
        await axios
        .get(CONFIG.ROOT_PATH + 'login', { params: { usuario: this.usuario }})
        .then(response => {
          if (response.data.error){
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,response.data.mensaje + ' - Consulta Usuario Login')
          } else{
            this.datosUsuario = response.data.datos
            if (this.datosUsuario == 0) {
              this.usuario = ''
              this.clave = ''
              this.$refs.usuario.focus()
              this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'¡Lo sentimos!. El Usuario no se encuentra registrado, verifique e intente nuevamente.')
            } else {
              if (this.datosUsuario.estado == 1) {
                if (this.clave == this.datosUsuario.clave) {
                  if (this.datosUsuario.vigencia != null) {
                    if (this.datosUsuario.id_entorno == 1) {
                      let token = jwt.sign({id: this.datosUsuario.id}, CONFIG.SECRET_KEY, {expiresIn: '14400s'})
                      location.replace(CONFIG.ROOT_MODULO_ADMON + '/?token=' + token)
                    } else if (this.datosUsuario.id_entorno == 2) {
                      let token = jwt.sign({id: this.datosUsuario.id}, CONFIG.SECRET_KEY, {expiresIn: '14400s'})
                      location.replace(CONFIG.ROOT_MODULO_COLEGIO + '/?token=' + token)
                    } else {
                      this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'¡Lo sentimos!. El entorno del usuario no esta autorizado para iniciar sesión.')
                    }
                  } else {
                    this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'¡Lo sentimos!. La fecha válida de de acceso ha caducado.')
                  }
                } else {
                  this.clave = ''
                  this.$refs.clave.focus()
                  this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'¡Lo sentimos!. La contraseña está errada, verifique e intente nuevamente.')
                }
              } else {
                this.usuario = ''
                this.clave = ''
                this.$refs.usuario.focus()
                this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'¡Lo sentimos!. La cuenta del usuario está inactiva.')
              }
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
      restaurarClave() {
        this.$router.push('./recuperaclave')
      },
      activarUsuario() {
        this.msjUsuario = ''
      },
      activarClave() {
        this.msjClave = ''
      },
      validarCampos() {
        if (this.usuario == '') {
          this.msjUsuario = 'Digite el usuario'
          this.$refs.usuario.focus()
        } else if (this.clave == '') {
          this.msjClave = 'Digite la contraseña'
          this.$refs.clave.focus()
        } else {
          this.validarSesion()
        }
      },
      mensajeEmergente(variante, titulo, contenido) {
        this.$bvToast.toast(contenido, { title: titulo, variant: variante, toaster: "b-toaster-top-center", solid: true, autoHideDelay: 4000, appendToast: false })
      }
    },
    beforeMount() {
      sessionStorage.clear()
    }
  }
</script>