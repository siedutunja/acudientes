module.exports = {
  lintOnSave: false,
  runtimeCompiler: true,
  publicPath: '/login/',
  outputDir: 'login',
  configureWebpack: {
    resolve: {
       symlinks: false
    }
  },
  transpileDependencies: [
    '@coreui/utils',
    '@coreui/vue'
  ]
}
