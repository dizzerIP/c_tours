export default function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'Некорректный JSON в теле запроса'
      }
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Превышен допустимый размер запроса'
      }
    });
  }

  console.error({
    method: req.method,
    path: req.path,
    message: error.message
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Внутренняя ошибка сервера'
    }
  });
}