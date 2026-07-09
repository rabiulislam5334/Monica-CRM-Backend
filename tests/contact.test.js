const jwt = require("jsonwebtoken");

jest.mock("../src/config/prisma", () => ({
  contact: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

const prisma = require("../src/config/prisma");
const app = require("../src/app");
const request = require("supertest");

const TEST_USER = { id: 1, email: "demo@example.com" };
const token = jwt.sign(TEST_USER, process.env.JWT_SECRET, { expiresIn: "1h" });
const authHeader = { Authorization: `Bearer ${token}` };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/contacts/:id/favorite", () => {
  it("marks a contact as favorite", async () => {
    const existingContact = {
      id: 5,
      userId: TEST_USER.id,
      isFavorite: false,
      firstName: "John",
    };
    const updatedContact = { ...existingContact, isFavorite: true };

    prisma.contact.findFirst.mockResolvedValue(existingContact);
    prisma.contact.update.mockResolvedValue(updatedContact);

    const res = await request(app)
      .post("/api/contacts/5/favorite")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data.isFavorite).toBe(true);
  });
});

describe("PUT /api/contacts/:id/note", () => {
  it("updates the personal note of a contact", async () => {
    const existingContact = { id: 5, userId: TEST_USER.id, personalNote: null };
    const updatedContact = {
      ...existingContact,
      personalNote: "Met at a conference.",
    };

    prisma.contact.findFirst.mockResolvedValue(existingContact);
    prisma.contact.update.mockResolvedValue(updatedContact);

    const res = await request(app)
      .put("/api/contacts/5/note")
      .set(authHeader)
      .send({ personal_note: "Met at a conference." });

    expect(res.status).toBe(200);
    expect(res.body.data.personalNote).toBe("Met at a conference.");
  });
});

describe("GET /api/contacts?favorite=1", () => {
  it("filters contacts by favorite=1", async () => {
    const favoriteContacts = [
      { id: 1, userId: TEST_USER.id, firstName: "John", isFavorite: true },
      { id: 3, userId: TEST_USER.id, firstName: "Alice", isFavorite: true },
    ];

    prisma.contact.findMany.mockResolvedValue(favoriteContacts);
    prisma.contact.count.mockResolvedValue(favoriteContacts.length);

    const res = await request(app)
      .get("/api/contacts?favorite=1")
      .set(authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});
