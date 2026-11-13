import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';
import fs from 'fs';

async function run() {
  const baseDir = process.env.LOCALAPPDATA || process.cwd();
  const dbDir = process.env.PGDATA_DIR || path.resolve(baseDir, 'memorybridge_pgdata');
  console.log('Starting Embedded PostgreSQL in:', dbDir);

  const pidFile = path.join(dbDir, 'postmaster.pid');
  if (fs.existsSync(pidFile)) {
    console.log('Removing stale postmaster.pid...');
    try {
      fs.unlinkSync(pidFile);
    } catch (e) {
      // ignore
    }
  }

  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    user: 'postgres',
    password: 'password',
    port: 5432,
    persistent: true,
    autoRehydrateSymlinks: true
  });

  const isInitialized = fs.existsSync(path.join(dbDir, 'PG_VERSION'));
  if (!isInitialized) {
    console.log('Initializing cluster...');
    await pg.initialise();
  }

  console.log('Starting Postgres on port 5432...');
  await pg.start();
  console.log('Postgres started successfully on port 5432!');

  try {
    await pg.createDatabase('memorybridge');
  } catch (err: any) {
    // Already exists
  }

  try {
    await pg.createDatabase('memorybridge_test');
  } catch (err: any) {
    // Already exists
  }

  console.log('Databases memorybridge and memorybridge_test are ready.');

  // Keep alive
  setInterval(() => {}, 60000);
}

run().catch((err) => {
  console.error('Failed to run embedded postgres:', err);
  process.exit(1);
});
