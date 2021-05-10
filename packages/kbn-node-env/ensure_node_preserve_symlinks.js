/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

(function () {
  const cp = require('child_process');

  const calculateInspectPortOnExecArgv = function (processExecArgv) {
    const execArgv = [].concat(processExecArgv);

    if (execArgv.length === 0) {
      return execArgv;
    }

    const inspectFlagIndex = execArgv.reverse().findIndex(function (flag) {
      return flag.startsWith('--inspect');
    });

    if (inspectFlagIndex !== -1) {
      let inspectFlag;
      let inspectPortCounter = 9230;
      const argv = execArgv[inspectFlagIndex];

      if (argv.includes('=')) {
        // --inspect=port
        const argvSplit = argv.split('=');
        const flag = argvSplit[0];
        const port = argvSplit[1];
        inspectFlag = flag;
        inspectPortCounter = Number.parseInt(port, 10) + 1;
      } else {
        // --inspect
        inspectFlag = argv;

        // is number?
        if (String(execArgv[inspectFlagIndex + 1]).match(/^[0-9]+$/)) {
          // --inspect port
          inspectPortCounter = Number.parseInt(execArgv[inspectFlagIndex + 1], 10) + 1;
          execArgv.slice(inspectFlagIndex + 1, 1);
        }
      }

      execArgv[inspectFlagIndex] = inspectFlag + '=' + inspectPortCounter;
    }

    return execArgv;
  };

  const preserveSymlinksOption = '--preserve-symlinks';
  const preserveSymlinksMainOption = '--preserve-symlinks-main';
  const nodeOptions = (process && process.env && process.env.NODE_OPTIONS) || [];
  const nodeExecArgv = calculateInspectPortOnExecArgv((process && process.execArgv) || []);

  const isPreserveSymlinksPresent =
    nodeOptions.includes(preserveSymlinksOption) || nodeExecArgv.includes(preserveSymlinksOption);
  const isPreserveSymlinksMainPresent =
    nodeOptions.includes(preserveSymlinksMainOption) ||
    nodeExecArgv.includes(preserveSymlinksMainOption);

  if (isPreserveSymlinksPresent && isPreserveSymlinksMainPresent) {
    return;
  }

  const nodeArgv = (process && process.argv) || [];
  const isFirstArgNode = nodeArgv.length > 0 && nodeArgv[0].includes('node') ? nodeArgv[0] : null;
  if (!isFirstArgNode) {
    return;
  }

  const missingNodeArgs = [];
  if (!isPreserveSymlinksMainPresent) {
    missingNodeArgs.push(preserveSymlinksMainOption);
  }

  if (!isPreserveSymlinksPresent) {
    missingNodeArgs.push(preserveSymlinksOption);
  }

  const nodeArgs = nodeExecArgv.concat(missingNodeArgs);
  const restArgs = nodeArgv.length >= 2 ? nodeArgv.slice(1, nodeArgv.length) : [];

  const getExitCodeFromSpawnResult = function (spawnResult) {
    if (spawnResult.status !== null) {
      return spawnResult.status;
    }

    if (spawnResult.signal !== null) {
      return 128 + spawnResult.signal;
    }

    if (spawnResult.error) {
      return 1;
    }

    return 0;
  };

  // Since we are using `stdio: inherit`, the child process will receive
  // the `SIGINT` and `SIGTERM` from the terminal.
  // However, we want the parent process not to exit until the child does.
  // Adding the following handlers achieves that.
  process.on('SIGINT', function () {});
  process.on('SIGTERM', function () {});

  const spawnResult = cp.spawnSync(nodeArgv[0], nodeArgs.concat(restArgs), { stdio: 'inherit' });
  process.exit(getExitCodeFromSpawnResult(spawnResult));
})();
