require('dotenv').config();

// Treats unfilled .env.example values (e.g. "your_ticketmaster_key", "<user>") as missing.
function read(name, fallback = '') {
  const value = (process.env[name] || '').trim();
  const isPlaceholder = !value || value.startsWith('your_') || value.includes('<');
  return isPlaceholder ? fallback : value;
}

const env = {
  port: Number(read('PORT')) || 5000,
  mongoUri: read('MONGO_URI'),
  tmApiKey: read('TM_API_KEY'),
  clientUrl: read('CLIENT_URL', 'http://localhost:5173'),
  serverUrl: read('SERVER_URL', 'http://localhost:5000'),
};

module.exports = env;
