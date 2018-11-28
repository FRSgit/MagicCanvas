module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg   : grunt.file.readJSON('package.json'),
    concat: {
      options: {},
      dist   : {
        src : ['src/<%= pkg.name %>.js'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    uglify: {
      main: {
        src : 'dist/<%= pkg.name %>.min.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    copy  : {
      docs: {
        src : 'dist/<%= pkg.name %>.min.js',
        dest: 'docs/<%= pkg.name %>.min.js'
      }
    },
    watch : {
      scripts: {
        files  : ['*.js'],
        tasks  : ['concat', 'uglify', 'copy'],
        options: {
          spawn: false
        }
      }
    }
  })

  // Load the plugins.
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-concat')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-contrib-watch')

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify', 'copy'])
  grunt.registerTask('watch', ['watch'])
}
