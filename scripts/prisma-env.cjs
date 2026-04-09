'use strict';

require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });

/**
 * Espelha src/instrument-env.ts em CommonJS para rodar antes do Prisma CLI,
 * sem depender de lib/ (nest build pode ainda não ter rodado).
 */
const { existsSync } = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function findPrismaDir(startDir) {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const schemaPath = path.join(dir, 'prisma', 'schema.prisma');
    if (existsSync(schemaPath)) {
      return path.join(dir, 'prisma');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(process.cwd(), 'prisma');
}

function normalizeSqliteDatabaseUrl(url, prismaDir) {
  if (!url.startsWith('file:')) return url;
  const body = url.slice('file:'.length);
  if (body.startsWith('//') || /^[A-Za-z]:/.test(body) || body.startsWith('/')) {
    return url;
  }
  const relative = body.replace(/^\.\//, '');
  const abs = path.join(prismaDir, relative);
  const forward = abs.replace(/\\/g, '/');
  return `file:${forward}`;
}

function loadInstrumentEnv() {
  const prismaDir = findPrismaDir(root);
  if (!process.env.DATABASE_URL?.trim()) {
    const abs = path.join(prismaDir, 'render.db').replace(/\\/g, '/');
    process.env.DATABASE_URL = `file:${abs}`;
  } else {
    process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(
      process.env.DATABASE_URL.trim(),
      prismaDir,
    );
  }
}

module.exports = { root, loadInstrumentEnv };
