'use strict';

const path = require('path');

const root = path.resolve(__dirname, '..');

/** Injeta DATABASE_URL padrão (SQLite em prisma/) antes de qualquer comando Prisma CLI. */
function loadInstrumentEnv() {
  require(path.join(root, 'lib', 'src', 'instrument-env.js'));
}

module.exports = { root, loadInstrumentEnv };
