import _, { keys } from 'lodash';

import { run } from '../utilities/visual_regression';
import { esTestConfig } from '../src/test_utils/es';

const EsStartTestContainer = `elasticsearch:port=${esTestConfig.getPort()}`;
const EsStopTestContainer = `elasticsearch:stop:port=${esTestConfig.getPort()}`;

module.exports = function (grunt) {
  grunt.registerTask(
    'test:visualRegression:buildGallery',
    'Compare screenshots and generate diff images.',
    function () {
      const done = this.async();
      run(done);
    }
  );

  grunt.registerTask('test:server', [
    'checkPlugins',
    'simplemocha:all',
  ]);

  grunt.registerTask('test:browser', [
    'checkPlugins',
    'run:testServer',
    'karma:unit',
  ]);

  grunt.registerTask('test:browser-ci', () => {
    const ciShardTasks = keys(grunt.config.get('karma'))
      .filter(key => key.startsWith('ciShard-'))
      .map(key => `karma:${key}`);

    grunt.log.ok(`Running UI tests in ${ciShardTasks.length} shards`);

    grunt.task.run([
      'run:testServer',
      ...ciShardTasks
    ]);
  });

  grunt.registerTask('test:coverage', [ 'run:testCoverageServer', 'karma:coverage' ]);

  grunt.registerTask('test:quick', [
    'test:server',
    'test:ui',
    'test:jest',
    'test:browser',
    'test:api'
  ]);

  grunt.registerTask('test:dev', [
    'checkPlugins',
    'run:devTestServer',
    'karma:dev'
  ]);

  grunt.registerTask('test:ui', [
    'checkPlugins',
    EsStartTestContainer,
    'run:testUIServer',
    'functional_test_runner:functional',
    EsStopTestContainer,
    'stop:testUIServer'
  ]);

  grunt.registerTask('test:uiRelease', [
    'checkPlugins',
    EsStartTestContainer,
    'run:testUIReleaseServer',
    'functional_test_runner:functional',
    EsStopTestContainer,
    'stop:testUIReleaseServer'
  ]);

  grunt.registerTask('test:ui:server', [
    'checkPlugins',
    EsStartTestContainer,
    'run:testUIDevServer:keepalive'
  ]);

  grunt.registerTask('test:api', [
    EsStartTestContainer,
    'run:apiTestServer',
    'functional_test_runner:apiIntegration',
    EsStopTestContainer,
    'stop:apiTestServer'
  ]);

  grunt.registerTask('test:api:server', [
    EsStartTestContainer,
    'run:devApiTestServer:keepalive'
  ]);

  grunt.registerTask('test:api:runner', () => {
    grunt.fail.fatal('test:api:runner has moved, use: `node scripts/functional_test_runner --config test/api_integration/config.js`');
  });

  grunt.registerTask('test', subTask => {
    if (subTask) grunt.fail.fatal(`invalid task "test:${subTask}"`);

    grunt.task.run(_.compact([
      !grunt.option('quick') && 'run:eslint',
      'licenses',
      'test:quick'
    ]));
  });

  grunt.registerTask('quick-test', ['test:quick']); // historical alias
};
