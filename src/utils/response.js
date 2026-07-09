function success(res, { data = null, meta = undefined, status = 200 } = {}) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

function failure(
  res,
  { message = "Something went wrong", errors = undefined, status = 400 } = {},
) {
  const body = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { success, failure };
