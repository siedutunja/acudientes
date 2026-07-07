module.exports = {
  lintOnSave: false,
  runtimeCompiler: true,
  publicPath: '/acudientes/',
  outputDir: 'acudientes',
  devServer: {
    port: 8085
  },
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
