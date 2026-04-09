'use strict';

const path = require('path');
const { spawn } = require('child_process');
const { root } = require('./prisma-env.cjs');
const { runMigrateDeploy } = require('./migrate-deploy.cjs');

runMigrateDeploy();

const mainJs = path.join(root, 'lib', 'src', 'main.js');
const child = spawn(process.execPath, [mainJs], {
  stdio: 'inherit',
  cwd: root,
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code === 0 ? 0 : code ?? 1);
});
