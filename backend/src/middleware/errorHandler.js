function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express 5 forwards rejected promises from async handlers here automatically.
function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate entry';
  } else if (err.name === 'ValidationError') {
    status = 400;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}

module.exports = { notFound, errorHandler };
