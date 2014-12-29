module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Js Hint
    jshint: {
      options: {
        reporter: require('jshint-stylish')
      },
      all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
    },

    // Jamsine
    jasmine: {
      emailBuilder: {
        src: 'index.js',
        options: {
          specs: 'test/specs/*Spec.js',
          helpers: 'test/spec/*Helper.js'
        }
      }
    }
  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Default task(s).
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('test',    ['jshint', 'jasmine']);

};
