import request from 'supertest';
import { jest, describe, it, expect, afterEach } from '@jest/globals';
import app from '../app.js';
import UserModel from '../models/userModel.js';
import { loginUser } from "../controllers/userController.js";

describe('POST /api/users/register - simple test', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should register user successfully and set cookie', async () => {
    jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);
    jest.spyOn(UserModel, 'create').mockResolvedValue({
      _id: '123',
      username: 'test',
      email: 'new@example.com',
      password: 'hashedpwd'
    });

    const res = await request(app)
      .post('/api/users/register')
      .send({ username: 'test', email: 'new@example.com', password: '123456' });

    expect(res.statusCode).toBe(302);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['location']).toBe('/home');
  });
});

describe("loginUser controller", () => {
  it("should redirect to /home when login success", async () => {
    const req = {
      body: { email: "test@example.com", password: "123456" },
      headers: {},
    };
    const res = {
      cookie: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
    };

    // mock user model
    const mockUser = { _id: "1", email: "test@example.com", password: "hashed" };
    const User = await import("../models/userModel.js").then(m => m.default);
    jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

    // mock bcrypt.compare
    const bcrypt = await import("bcrypt").then(m => m.default);
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    // mock jwt.sign
    const jwt = await import("jsonwebtoken").then(m => m.default);
    jest.spyOn(jwt, "sign").mockReturnValue("mocktoken");

    await loginUser(req, res);

    expect(res.cookie).toHaveBeenCalledWith("token", "mocktoken", expect.any(Object));
    expect(res.redirect).toHaveBeenCalledWith("/home");
  });
});
