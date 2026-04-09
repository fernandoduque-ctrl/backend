'use strict';

const { existsSync } = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { root } = require('./prisma-env.cjs');
const { runMigrateDeploy } = require('./migrate-deploy.cjs');

const mainJs = path.join(root, 'lib', 'src', 'main.js');
if (!existsSync(mainJs)) {
  console.error(
    '[start-prod] Falta lib/src/main.js — o Nest não foi compilado neste deploy.\n' +
      'Na Render, altere o Build Command para (exemplo):\n' +
      '  yarn && yarn build:deploy\n' +
      'Só "yarn" instala pacotes e não gera lib/.',
  );
  process.exit(1);
}

runMigrateDeploy();
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
