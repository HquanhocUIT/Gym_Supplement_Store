module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const requestedStatus = err.status || err.statusCode;
  const status = Number.isInteger(requestedStatus) && requestedStatus >= 400 && requestedStatus <= 599
    ? requestedStatus
    : 500;
  const isClientError = status < 500;
  let code = isClientError ? (err.code || 'BAD_REQUEST') : 'INTERNAL_ERROR';
  let message = isClientError ? (err.message || 'Invalid request') : 'Internal Server Error';

  if (err.type === 'entity.parse.failed') {
    code = 'INVALID_JSON';
    message = 'Request body must be valid JSON';
  } else if (err.type === 'entity.too.large') {
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  if (!isClientError) console.error('Unhandled API error.');

  res.status(status).json({
    success: false,
    data: null,
    error: {
      message,
      code,
    },
  });
};
