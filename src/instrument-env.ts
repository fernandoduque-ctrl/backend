/**
 * Garante DATABASE_URL antes de carregar módulos que instanciam o Prisma Client.
 * No SQLite, caminhos relativos em file: são resolvidos a partir do diretório prisma/.
 */
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = 'file:./render.db';
}
