const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const { success } = require("./utils/response");

const app = express();

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => success(res, { data: { status: "ok" } }));

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
