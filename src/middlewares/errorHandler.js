const { failure } = require("../utils/response");

function notFound(req, res, next) {
  return failure(res, {
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    status: 404,
  });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2025") {
    return failure(res, { message: "Resource not found", status: 404 });
  }
  if (err.code === "P2002") {
    return failure(res, {
      message: "Duplicate value violates a unique constraint",
      status: 409,
    });
  }

  const status = err.status || 500;
  return failure(res, {
    message: err.message || "Internal server error",
    status,
  });
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { notFound, errorHandler, asyncHandler };
