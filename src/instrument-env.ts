/**
 * Garante DATABASE_URL antes de carregar módulos que instanciam o Prisma Client.
 *
 * Carrega `.env` aqui (e não só no ConfigModule) para que DATABASE_URL exista antes do
 * bootstrap do Nest.
 */
import { config as loadEnv } from 'dotenv';
import { join } from 'path';

loadEnv({ path: join(process.cwd(), '.env') });

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
