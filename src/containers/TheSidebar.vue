<template>
  <CSidebar fixed :minimize="minimize" :show="show" @update:show="(value) => $store.commit('set', ['sidebarShow', value])">
    <CSidebarBrand class="d-md-down-none">
      <CIcon src="logo_header.png" class="c-sidebar-brand-full" name="logo" size="custom-size" :height="30" viewBox="0 0 110 134"/>
      <b-avatar class="c-sidebar-brand-minimized" variant="light" src="escudo-tunja.png"></b-avatar>
    </CSidebarBrand>
    <CRenderFunction flat :content-to-render="$options.nav"/>
    <CSidebarMinimizer class="d-md-down-none" @click.native="$store.commit('set', ['sidebarMinimize', !minimize])"/>
  </CSidebar>
</template>

<script>
import nav from './_nav'

export default {
  name: 'TheSidebar',
  nav,
  computed: {
    show () {
      return this.$store.state.sidebarShow
    },
    minimize () {
      return this.$store.state.sidebarMinimize
    }
  }
}
</script>
