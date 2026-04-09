/**
 * Garante DATABASE_URL antes de carregar módulos que instanciam o Prisma Client.
 *
 * No runtime do Nest, `file:./dev.db` pode ser resolvido em relação ao cwd do processo,
 * abrindo um SQLite vazio (sem tabelas). Ancoramos caminhos relativos ao diretório
 * `prisma/` onde está o schema, alinhado ao `prisma db push` / migrate.
 */
import { existsSync } from 'fs';
import { dirname, join } from 'path';

function findPrismaDir(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const schemaPath = join(dir, 'prisma', 'schema.prisma');
    if (existsSync(schemaPath)) {
      return join(dir, 'prisma');
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  return join(process.cwd(), 'prisma');
}

const prismaDir = findPrismaDir(__dirname);

function normalizeSqliteDatabaseUrl(url: string): string {
  if (!url.startsWith('file:')) {
    return url;
  }
  const body = url.slice('file:'.length);
  // Já absoluto: file:///… ou file:C:/…
  if (body.startsWith('//') || /^[A-Za-z]:/.test(body) || body.startsWith('/')) {
    return url;
  }
  const relative = body.replace(/^\.\//, '');
  const abs = join(prismaDir, relative);
  // Prisma + SQLite no Windows: `file:///C:/...` (pathToFileURL) pode falhar com erro 14; usar file:C:/...
  const forward = abs.replace(/\\/g, '/');
  return `file:${forward}`;
}

if (!process.env.DATABASE_URL?.trim()) {
  const abs = join(prismaDir, 'render.db').replace(/\\/g, '/');
  process.env.DATABASE_URL = `file:${abs}`;
} else {
  process.env.DATABASE_URL = normalizeSqliteDatabaseUrl(process.env.DATABASE_URL.trim());
}
