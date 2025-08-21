/* Pre-warm mongodb-memory-server binary to avoid downloads during tests */
const path = require('path');

process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';
process.env.MONGOMS_DOWNLOAD_DIR = process.env.MONGOMS_DOWNLOAD_DIR || path.resolve('.cache', 'mongodb-binaries');

async function prewarm() {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const server = await MongoMemoryServer.create({
      binary: {
        version: process.env.MONGOMS_VERSION,
        downloadDir: process.env.MONGOMS_DOWNLOAD_DIR,
      },
      instance: { storageEngine: 'wiredTiger' },
    });
    await server.stop();
    console.log(`mongodb-memory-server binary ready in ${process.env.MONGOMS_DOWNLOAD_DIR}`);
  } catch (err) {
    console.warn('Prewarm skipped or failed:', err?.message || err);
  }
}

prewarm();


