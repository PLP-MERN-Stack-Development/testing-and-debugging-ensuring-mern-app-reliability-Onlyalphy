// server/tests/setup.js

// Increase timeout for all tests (especially for MongoMemoryServer startup)
jest.setTimeout(60000);

// Set environment to test
process.env.NODE_ENV = 'test';

// Configure MongoMemoryServer
process.env.MONGOMS_DOWNLOAD_DIR = './.cache/mongodb-binaries';
process.env.MONGOMS_VERSION = '6.0.0';
process.env.MONGOMS_DISABLE_POSTINSTALL = '1';

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };