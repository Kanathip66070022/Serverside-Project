const request = require("supertest");
const app = require("../src/app");

describe("User API", () => {
  it("should register a user", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({ username: "test", email: "test@mail.com", password: "123456" });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty("token");
  });
});