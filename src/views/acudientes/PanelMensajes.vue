<template>
  <div class="mensajes-card mb-4" v-if="mensajes.length">
    <div class="msg-card-header">
      <div class="msg-card-title"><CIcon name="cil-envelope-closed" class="mr-2"/> Mensajes</div>
      <span v-if="noLeidos > 0" class="msg-badge">{{ noLeidosLabel }}</span>
    </div>
    <div class="msg-card-body" :class="{ 'msg-card-body-scroll': mostrarTodos && mensajes.length > limite }">
      <div v-for="msg in mensajesVisibles" :key="msg.id" class="msg-item" :class="{ 'msg-item-nuevo': !msg.leido }" role="button" @click="abrirMensaje(msg)">
        <span v-if="!msg.leido" class="msg-dot"></span>
        <div class="msg-item-content">
          <div class="d-flex justify-content-between align-items-start">
            <strong class="msg-item-asunto">{{ msg.asunto }}</strong>
            <span class="msg-item-fecha">{{ formatFnF(msg.creado) }}</span>
          </div>
          <div class="msg-item-remitente">{{ msg.remitente }} <span class="msg-item-rol">· {{ msg.rol }}</span></div>
        </div>
      </div>
    </div>

    <div class="msg-card-footer" v-if="mensajes.length > limite">
      <button type="button" class="msg-ver-mas" @click="mostrarTodos = !mostrarTodos">
        {{ mostrarTodos ? 'Ver menos' : 'Ver más (' + (mensajes.length - limite) + ')' }}
      </button>
    </div>

    <b-modal ref="modalMensaje" size="lg" scrollable hide-footer centered no-close-on-backdrop content-class="msg-modal">
      <template #modal-header="{ close }">
        <div class="msg-modal-header">
          <div class="msg-modal-asunto">{{ mensajeSeleccionado.asunto }}</div>
          <button type="button" class="msg-modal-close" @click="close">&times;</button>
        </div>
      </template>
      <div class="msg-modal-body">
        <div class="msg-modal-meta">
          <span class="msg-modal-remitente"><CIcon name="cil-user" height="14" class="mr-1"/>{{ mensajeSeleccionado.remitente }}</span>
          <span class="msg-modal-pill">{{ mensajeSeleccionado.rol }}</span>
          <span class="msg-modal-fecha"><CIcon name="cil-calendar" height="14" class="mr-1"/>{{ formatFnF(mensajeSeleccionado.creado) }}</span>
        </div>
        <p class="msg-modal-texto" style="white-space: pre-line;">{{ mensajeSeleccionado.mensaje }}</p>
      </div>
    </b-modal>
  </div>
</template>

<script>
import axios from 'axios'
import * as CONFIG from '@/assets/config.js'

export default {
  name: 'PanelMensajes',
  props: {
    mensajes: { type: Array, default: () => [] },
    idPersona: { type: String, default: '' }
  },
  data () {
    return {
      mensajeSeleccionado: {},
      limite: 5,
      mostrarTodos: false
    }
  },
  computed: {
    noLeidos () {
      return this.mensajes.filter(m => !m.leido).length
    },
    noLeidosLabel () {
      return this.noLeidos > 9 ? '+9' : String(this.noLeidos)
    },
    mensajesVisibles () {
      return this.mostrarTodos ? this.mensajes : this.mensajes.slice(0, this.limite)
    }
  },
  methods: {
    formatFnF (value) {
      if (value != null && value != '') {
        return String(value).substr(0, 10)
      }
      return '-'
    },
    abrirMensaje (msg) {
      this.mensajeSeleccionado = msg
      this.$refs['modalMensaje'].show()
      if (!msg.leido) {
        this.marcarLeido(msg)
      }
    },
    async marcarLeido (msg) {
      try {
        await axios.post(CONFIG.ROOT_PATH + 'acudientes/mensajes/leido', { idMensaje: msg.id, idPersona: this.idPersona })
        this.$emit('leido', msg.id)
      } catch (e) {
        // Falla silenciosa: el mensaje sigue visible como no leído en el próximo refresco.
      }
    }
  }
}
</script>

<style scoped>
.mensajes-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(0, 30, 70, 0.08);
  overflow: hidden;
  border-left: 5px solid #1e4f8f;
}
.msg-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: #f4f8fd;
  border-bottom: 1px solid #e8eef5;
}
.msg-card-title {
  font-weight: 700;
  color: #1e4f8f;
  font-size: 1.02rem;
}
.msg-card-body { padding: .25rem 1.25rem; }
.msg-card-body-scroll {
  max-height: 420px;
  overflow-y: auto;
}
.msg-card-footer {
  text-align: center;
  padding: .6rem 1.25rem .9rem;
  border-top: 1px solid #eef1f4;
}
.msg-ver-mas {
  background: transparent;
  border: none;
  color: #1e4f8f;
  font-weight: 600;
  font-size: .85rem;
  padding: .3rem .8rem;
  border-radius: 999px;
}
.msg-ver-mas:hover { background: #f0f5fb; }
.msg-item {
  position: relative;
  cursor: pointer;
  padding: .75rem .25rem .75rem 1.1rem;
  border-bottom: 1px solid #eef1f4;
  transition: background .15s ease;
}
.msg-item:last-child { border-bottom: none; }
.msg-item:hover { background: #f7f9fc; }
.msg-dot {
  position: absolute;
  left: 0;
  top: 1.1rem;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2563eb;
}
.msg-item-asunto { color: #24313f; font-size: .95rem; }
.msg-item-nuevo .msg-item-asunto { color: #1e4f8f; }
.msg-item-fecha { font-size: .76rem; color: #8b98a6; white-space: nowrap; margin-left: .5rem; }
.msg-item-remitente { font-size: .8rem; color: #6b7a8a; margin-top: .1rem; }
.msg-item-rol { color: #8b98a6; }
.msg-badge {
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 700;
  padding: 0 .4rem;
}

/* ── Modal de detalle ── */
.msg-modal-header {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.1rem 1.25rem;
  background: #1e4f8f;
  border-radius: calc(0.3rem - 1px) calc(0.3rem - 1px) 0 0;
}
.msg-modal-asunto {
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  padding-right: 1rem;
}
.msg-modal-close {
  background: transparent;
  border: none;
  color: #fff;
  opacity: .85;
  font-size: 1.4rem;
  line-height: 1;
}
.msg-modal-close:hover { opacity: 1; }
.msg-modal-body { padding: 1.25rem; }
.msg-modal-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .6rem;
  margin-bottom: 1rem;
  font-size: .85rem;
  color: #4a5e72;
}
.msg-modal-remitente { font-weight: 600; color: #1e4f8f; display: inline-flex; align-items: center; }
.msg-modal-fecha { display: inline-flex; align-items: center; color: #6b89b0; }
.msg-modal-pill {
  background: #e8f0fe;
  color: #1e4f8f;
  font-size: .76rem;
  font-weight: 600;
  padding: .2rem .65rem;
  border-radius: 999px;
}
.msg-modal-texto {
  line-height: 1.55;
  color: #24313f;
  margin: 0;
}
</style>
