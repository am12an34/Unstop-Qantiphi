const http = require('http');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const { initSocket } = require('./socket');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  const server = http.createServer(app);
  initSocket(server);
  server.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port}`);
    console.log(`Event source: ${env.tmApiKey ? 'Ticketmaster API' : 'mock data (no TM_API_KEY set)'}`);
  });
}

start();
