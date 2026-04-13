'use strict';

const { existsSync } = require('fs');
const http = require('http');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { root, loadInstrumentEnv } = require('./prisma-env.cjs');
const { runMigrateDeploy } = require('./migrate-deploy.cjs');

loadInstrumentEnv();

const mainJs = path.join(root, 'dist', 'src', 'main.js');

function startHealthStub() {
  const port = Number(process.env.PORT || 3001);
  const server = http.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('compiling');
  });
  return new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`[start-prod] Health stub em 0.0.0.0:${port} durante compile (Render health check).`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function run() {
  const needCompile = !existsSync(mainJs);
  let healthServer;

  if (needCompile) {
    healthServer = await startHealthStub();
    console.warn(
      '[start-prod] dist/ ausente — compilando no startup. Ideal na Render: Build Command = yarn && yarn build:deploy',
    );
    try {
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: root,
        env: process.env,
        shell: true,
      });
      execSync('npx nest build', {
        stdio: 'inherit',
        cwd: root,
        env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=4096' },
        shell: true,
      });
    } catch (e) {
      if (e.stderr) console.error(String(e.stderr));
      if (e.stdout) console.error(String(e.stdout));
      console.error('[start-prod] Falha em prisma generate / nest build:', e.message || e);
      process.exit(1);
    }
  }

  if (!existsSync(mainJs)) {
    console.error('[start-prod] Falha: dist/src/main.js ainda não existe após nest build.');
    process.exit(1);
  }

  try {
    runMigrateDeploy();
  } catch (e) {
    if (e.stderr) console.error(String(e.stderr));
    console.error('[start-prod] migrate deploy:', e.message || e);
    process.exit(1);
  }

  const skipSeed =
    process.env.SKIP_AUTO_SEED === '1' || /^true$/i.test(String(process.env.SKIP_AUTO_SEED || ''));
  if (!skipSeed) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const users = await prisma.user.count();
      if (users === 0) {
        console.log('[start-prod] Nenhum usuário no banco — rodando prisma db seed (admin + massa demo).');
        execSync('npx prisma db seed', {
          stdio: 'inherit',
          cwd: root,
          env: process.env,
          shell: true,
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  }

  if (healthServer) {
    await new Promise((resolve) => healthServer.close(() => resolve()));
    console.log('[start-prod] Encerrado health stub; subindo Nest…');
  }

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
}

run().catch((err) => {
  console.error('[start-prod]', err);
  process.exit(1);
});
