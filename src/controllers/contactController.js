const prisma = require("../config/prisma");
const { success, failure } = require("../utils/response");
const { asyncHandler } = require("../middlewares/errorHandler");

function buildContactWhere({ userId, favorite, search }) {
  const where = { userId };

  if (favorite === "1") where.isFavorite = true;
  if (favorite === "0") where.isFavorite = false;

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

async function paginatedContacts({ where, page, limit, sort, order }) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { [sort]: order },
      skip,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

const listContacts = asyncHandler(async (req, res) => {
  const { favorite, search, page, limit, sort, order } = req.validatedQuery;
  const where = buildContactWhere({ userId: req.user.id, favorite, search });

  const { items, meta } = await paginatedContacts({
    where,
    page,
    limit,
    sort,
    order,
  });
  return success(res, { data: items, meta });
});

const listFavorites = asyncHandler(async (req, res) => {
  const { search, page, limit, sort, order } = req.validatedQuery;
  const where = buildContactWhere({
    userId: req.user.id,
    favorite: "1",
    search,
  });

  const { items, meta } = await paginatedContacts({
    where,
    page,
    limit,
    sort,
    order,
  });
  return success(res, { data: items, meta });
});

const getContact = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const contact = await prisma.contact.findFirst({
    where: { id, userId: req.user.id },
  });

  if (!contact) {
    return failure(res, { message: "Contact not found", status: 404 });
  }

  return success(res, { data: contact });
});

const markFavorite = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const contact = await ensureOwnedContact(id, req.user.id);
  if (!contact)
    return failure(res, { message: "Contact not found", status: 404 });

  const updated = await prisma.contact.update({
    where: { id },
    data: { isFavorite: true },
  });
  return success(res, { data: updated });
});

const removeFavorite = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const contact = await ensureOwnedContact(id, req.user.id);
  if (!contact)
    return failure(res, { message: "Contact not found", status: 404 });

  const updated = await prisma.contact.update({
    where: { id },
    data: { isFavorite: false },
  });
  return success(res, { data: updated });
});

const toggleFavorite = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const contact = await ensureOwnedContact(id, req.user.id);
  if (!contact)
    return failure(res, { message: "Contact not found", status: 404 });

  const updated = await prisma.contact.update({
    where: { id },
    data: { isFavorite: !contact.isFavorite },
  });
  return success(res, { data: updated });
});

const updateNote = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const contact = await ensureOwnedContact(id, req.user.id);
  if (!contact)
    return failure(res, { message: "Contact not found", status: 404 });

  const updated = await prisma.contact.update({
    where: { id },
    data: { personalNote: req.body.personal_note },
  });
  return success(res, { data: updated });
});

const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [total, favorites, withNotes] = await Promise.all([
    prisma.contact.count({ where: { userId } }),
    prisma.contact.count({ where: { userId, isFavorite: true } }),
    prisma.contact.count({ where: { userId, personalNote: { not: null } } }),
  ]);

  return success(res, {
    data: {
      total_contacts: total,
      favorite_contacts: favorites,
      contacts_with_notes: withNotes,
    },
  });
});

async function ensureOwnedContact(id, userId) {
  return prisma.contact.findFirst({ where: { id, userId } });
}

module.exports = {
  listContacts,
  listFavorites,
  getContact,
  markFavorite,
  removeFavorite,
  toggleFavorite,
  updateNote,
  getStats,
};
