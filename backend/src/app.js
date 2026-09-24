const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const apiRoutes = require('./routes');
const shareController = require('./controllers/share.controller');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', true);
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api', apiRoutes);
// Short public invite links, e.g. http://localhost:5000/s/abc123
app.get('/s/:token', shareController.follow);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
