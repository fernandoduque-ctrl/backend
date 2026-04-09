'use strict';

const { execSync } = require('child_process');
const { root, loadInstrumentEnv } = require('./prisma-env.cjs');

function runMigrateDeploy() {
  loadInstrumentEnv();
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
    shell: true,
  });
}

if (require.main === module) {
  runMigrateDeploy();
}

module.exports = { runMigrateDeploy };
