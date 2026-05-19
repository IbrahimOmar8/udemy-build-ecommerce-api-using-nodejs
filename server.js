const http = require('http');
const dotenv = require('dotenv');

dotenv.config({ path: 'config.env' });

const dbConnection = require('./config/database');
const buildApp = require('./app');
const { initSocket } = require('./config/socket');

dbConnection();

const app = buildApp();

if (process.env.NODE_ENV === 'development') {
  console.log(`mode: ${process.env.NODE_ENV}`);
}

const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);
initSocket(httpServer);

if (process.env.RUN_WORKERS !== 'false') {
  require('./workers/emailWorker').start();
  require('./workers/certificateWorker').start();
}

const server = httpServer.listen(PORT, () => {
  console.log(`App running on port ${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api/docs`);
});

process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error('Shutting down...');
    process.exit(1);
  });
});
