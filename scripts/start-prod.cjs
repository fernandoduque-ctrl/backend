'use strict';

const { existsSync } = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { root, loadInstrumentEnv } = require('./prisma-env.cjs');
const { runMigrateDeploy } = require('./migrate-deploy.cjs');

loadInstrumentEnv();

const mainJs = path.join(root, 'lib', 'src', 'main.js');
if (!existsSync(mainJs)) {
  console.warn(
    '[start-prod] lib/ ausente — compilando no startup (recomendado na Render: Build Command = yarn && yarn build:deploy).',
  );
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
    shell: true,
  });
  execSync('npx nest build', {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
    shell: true,
  });
}

if (!existsSync(mainJs)) {
  console.error('[start-prod] Falha: lib/src/main.js ainda não existe após nest build.');
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
