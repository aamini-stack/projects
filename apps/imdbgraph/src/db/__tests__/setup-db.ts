import { db } from '../connection';
import fs from 'fs/promises';
import path from 'path';

/**
 * Run SQL schema migration files.
 */
export async function setUpSchema() {
  const migrations = path.join(process.cwd(), './src/db/tables/migrations');
  const files = await fs.readdir(migrations);
  const sqlFiles = files.filter((file: string) => file.endsWith('.sql')).sort();
  for (const file of sqlFiles) {
    const content = await fs.readFile(path.join(migrations, file), 'utf-8');
    // Split on statement breakpoints and execute each statement
    const statements = content
      .split('--> statement-breakpoint')
      .map((stmt: string) => stmt.trim())
      .filter((stmt: string) => stmt.length > 0);
    for (const statement of statements) {
      await db.execute(statement);
    }
  }
}

export async function wipeDb() {
  await db.execute('DROP SCHEMA public CASCADE');
  await db.execute('CREATE SCHEMA public');
}
