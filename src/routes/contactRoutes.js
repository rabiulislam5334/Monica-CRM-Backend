const express = require("express");
const { authenticate } = require("../middlewares/auth");
const {
  validateBody,
  validateQuery,
  noteSchema,
  contactListQuerySchema,
} = require("../validators/validators");
const {
  listContacts,
  listFavorites,
  getContact,
  markFavorite,
  removeFavorite,
  toggleFavorite,
  updateNote,
  getStats,
} = require("../controllers/contactController");

const router = express.Router();

router.use(authenticate);

router.get("/favorites", validateQuery(contactListQuerySchema), listFavorites);
router.get("/stats", getStats);

router.get("/", validateQuery(contactListQuerySchema), listContacts);
router.get("/:id", getContact);

router.post("/:id/favorite", markFavorite);
router.delete("/:id/favorite", removeFavorite);
router.patch("/:id/favorite", toggleFavorite);

router.put("/:id/note", validateBody(noteSchema), updateNote);

module.exports = router;
