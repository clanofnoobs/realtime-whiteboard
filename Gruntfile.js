module.exports = function(grunt) {
  grunt.initConfig({
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
  return grunt.loadNpmTasks('grunt-ssh');
};
