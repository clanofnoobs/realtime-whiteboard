module.exports = function(grunt) {
  require('jit-grunt')(grunt);

  grunt.initConfig({
    less:{
      development:{
        options:{
          compress:true,
          yuicompress: true,
          optimization: 2
        },
        files:{
          "./public/stylesheets/style1.css":"./less/style.less"
        }
      }
    },
    watch: {
      styles:{
        files:['less/**/*.less'],
        tasks: ['less'],
        options: {
        nospawn: true
        }
      }
    },
    sshconfig: {
      realtime: {
        host: '107.170.4.70',
        username: 'root',
        agent: process.env.SSH_AUTH_SOCK,
        agentForward: true
      }
    },
    sshexec: {
      deploy: {
        command: ['ls','./test.sh'].join(' && '),
        options: {
          config: 'realtime'
        }
      },
    }
  });
  grunt.registerTask('deploy', ['sshexec:deploy']);
  grunt.registerTask('default',['less','watch']);
  return grunt.loadNpmTasks('grunt-ssh');
};
