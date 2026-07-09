const { z } = require("zod");
const { failure } = require("../utils/response");

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const noteSchema = z.object({
  personal_note: z.string().max(5000).nullable(),
});

const contactListQuerySchema = z.object({
  favorite: z.enum(["0", "1"]).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z
    .enum(["first_name", "last_name", "createdAt", "updatedAt"])
    .optional()
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return failure(res, {
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
        status: 422,
      });
    }
    req.body = result.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return failure(res, {
        message: "Invalid query parameters",
        errors: result.error.flatten().fieldErrors,
        status: 422,
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  noteSchema,
  contactListQuerySchema,
  validateBody,
  validateQuery,
};
