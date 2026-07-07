<template>
  <CFooter :fixed="false">
    <div>
      <CIcon name="cil-shield-alt" style="margin-top: -5px"/>
      MÓDULO ACUDIENTE
    </div>
    <div class="mfs-auto">
      <span class="mr-1"></span>
      <a href="https://www.siedutunja.gov.co/" target="_blank">sieduTunja</a>
      <span class="ml-1">&copy; {{ new Date().getFullYear() }} - Ver: {{ version }}</span>
    </div>
  </CFooter>
</template>

<script>
import { version } from '@/../package.json'

export default {
  name: 'TheFooter',
  data () {
    return {
      version
    }
  }
}
</script>
