const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { success, failure } = require("../utils/response");
const { asyncHandler } = require("../middlewares/errorHandler");

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return failure(res, {
      message: "Email is already registered",
      status: 409,
    });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken(user);
  return success(res, { data: { user, token }, status: 201 });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return failure(res, { message: "Invalid credentials", status: 401 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return failure(res, { message: "Invalid credentials", status: 401 });
  }

  const token = signToken(user);
  return success(res, {
    data: {
      user: { id: user.id, name: user.name, email: user.email },
      token,
    },
  });
});

module.exports = { register, login };
