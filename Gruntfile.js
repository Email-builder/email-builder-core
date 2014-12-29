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

    // Unit tests
    nodeunit: {
      tests: ['test/*_test.js']
    }
  });

  // Load tasks
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Default task(s).
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('test',    ['jshint', 'jasmine']);

};
