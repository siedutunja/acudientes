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
                  <h5 class="text-muted">Recuperar Contraseña</h5>
                  <p>Para recuperar la contraseña, ingrese el Usuario y se le enviara un correo con la información solicitada al correo registrado.</p>
                  <b-input-group>
                    <template #prepend>
                      <b-input-group-text><CIcon name="cil-user"/></b-input-group-text>
                    </template>
                    <b-form-input type="text" v-model="usuario" placeholder="Usuario" @change="activarUsuario" ref="usuario"></b-form-input>
                  </b-input-group>
                  <span class="text-left text-danger">{{msjUsuario}}</span>
                  <b-button type="submit" class="btn mb-2 mt-3 btn-block" variant="primary">Enviar Correo</b-button>
                  <b-button class="float-right text-info mt-3" variant="link" @click="irAlLogin"><small><em>Ya tengo mi Contraseña</em></small></b-button>
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

  export default {
    name: 'RecuperaClave',
    data () {
      return {
        usuario: '',
        msjUsuario: '',
        datosUsuario: { 
          id: null, 
          usuario: null,
          clave: null,
          estado: null,
          vigencia: null,
          correo: null
        }
      }
    },
    methods: {
      irAlLogin() {
        this.$router.push('./')
      },
      activarUsuario() {
        this.msjUsuario = ''
      },
      validarCampos() {
        if (this.usuario == '') {
          this.msjUsuario = 'Digite el usuario'
          this.$refs.usuario.focus()
        } else {
          this.validarSesion()
        }
      },
      async validarSesion() {
        await axios
        .get(CONFIG.ROOT_PATH + 'login/recuperaclave', { params: { usuario: this.usuario }})
        .then(response => {
          if (response.data.error){
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,response.data.mensaje + ' - Recuperar Contraseña')
          } else{
            if (response.data.datos == 0) {
              this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'¡Lo sentimos!. El Usuario no se encuentra registrado, verifique e intente nuevamente.')
            } else {
              this.datosUsuario = response.data.datos
              if (this.datosUsuario.estado == 1) {
                this.datosUsuario.estado = "ACTIVO"
              } else {
                this.datosUsuario.estado = "INACTIVO"
              }
              if (this.datosUsuario.vigencia != '' || this.datosUsuario.vigencia != null) {
                this.datosUsuario.vigencia = this.datosUsuario.vigencia.substr(0,10)
              }
              this.usuario = ''
              this.enviarCorreo()
            }
          }
        })
        .catch(err => {
          if (err == 'Error: Network Error') {
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Lo sentimos, se detecto un problema al conectarse con el servidor. (Certificado)')
          } else {
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Algo salio mal y no se pudo realizar: Recuperar Contraseña. Intente más tarde. ' + err)
          }
        })
      },
      async enviarCorreo() {
        await axios
        .post(CONFIG.ROOT_PATH + 'correos/recuperaclave', JSON.stringify(this.datosUsuario), { headers: {"Content-Type": "application/json; charset=utf-8" }})
        .then(response => {
          if (response.data.error){
            this.mensajeEmergente('danger',CONFIG.TITULO_MSG,response.data.mensaje + ' - Correo Recuperar Contraseña')
          } else {
            this.mensajeEmergente('success',CONFIG.TITULO_MSG,'Se ha enviado la Contraseña al correo registrado.')
          }
        })
        .catch(err => {
          this.mensajeEmergente('danger',CONFIG.TITULO_MSG,'Algo salio mal y no se pudo realizar: Correo Recuperar Contraseña. Intente más tarde. ' + err)
        })
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