'use strict';

require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });

/**
 * Espelha src/instrument-env.ts em CommonJS para rodar antes do Prisma CLI,
 * sem depender de dist/ (nest build pode ainda não ter rodado).
 */
const path = require('path');

const root = path.resolve(__dirname, '..');

function loadInstrumentEnv() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL não definida. Defina no .env (ex.: postgresql://usuario:senha@localhost:5432/nome_db?schema=public).',
    );
  }
  if (!/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error(
      'DATABASE_URL deve ser uma URL PostgreSQL (postgresql:// ou postgres://). URLs file: não são suportadas.',
    );
  }
}

module.exports = { root, loadInstrumentEnv };
