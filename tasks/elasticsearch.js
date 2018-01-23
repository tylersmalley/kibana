import { createEsContainer, findEsContainer } from '../src/es_container';

export default function (grunt) {
  grunt.registerTask('elasticsearch', '', function () {
    const done = this.async();
    const port = grunt.option('port');

    createEsContainer({ port }).then(container => {
      container.start().then(done);
    });
  });

  grunt.registerTask('elasticsearch:stop', '', function () {
    const done = this.async();
    const port = grunt.option('port', 9200);

    findEsContainer({ port }).then(container => {
      container.stop().then(done);
    }).catch(console.error);
  });
}
