const jwt = require("jsonwebtoken");
const { failure } = require("../utils/response");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return failure(res, {
      message: "Authentication token missing",
      status: 401,
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return failure(res, { message: "Invalid or expired token", status: 401 });
  }
}

module.exports = { authenticate };
