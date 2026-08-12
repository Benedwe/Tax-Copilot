import test from "node:test";
import assert from "node:assert/strict";

import {
  createAuthService,
  formatTin,
  publicUser,
} from "../src/services/authService.js";

test("formatTin normalizes valid TRA TIN values", () => {
  assert.equal(formatTin("123456789"), "123-456-789");
  assert.equal(formatTin("123-456-789"), "123-456-789");
  assert.equal(formatTin("123 456 789"), "123-456-789");
  assert.equal(formatTin("12345"), null);
});

test("publicUser strips passwordHash", () => {
  assert.deepEqual(
    publicUser({ id: "1", email: "a@example.com", passwordHash: "secret", name: "A" }),
    { id: "1", email: "a@example.com", name: "A" }
  );
});

test("register creates a user and returns a signed session payload", async () => {
  let receivedCreateData = null;
  const authService = createAuthService({
    findUserByEmail: async () => null,
    findUserById: async () => null,
    createUser: async (data) => {
      receivedCreateData = data;
      return { id: "user-1", ...data };
    },
    updateUser: async () => null,
    hashPassword: async () => "hashed-password",
    signToken: (user) => `token-${user.id}`,
  });

  const result = await authService.register({
    name: "Jane Doe",
    email: "JANE@EXAMPLE.COM",
    password: "password123",
    tin: "123456789",
  });

  assert.equal(result.token, "token-user-1");
  assert.deepEqual(result.user, {
    id: "user-1",
    name: "Jane Doe",
    email: "jane@example.com",
    authProvider: "password",
    tin: "123-456-789",
  });
  assert.deepEqual(receivedCreateData, {
    name: "Jane Doe",
    email: "jane@example.com",
    passwordHash: "hashed-password",
    authProvider: "password",
    tin: "123-456-789",
  });
});

test("register rejects duplicate email addresses", async () => {
  const authService = createAuthService({
    findUserByEmail: async () => ({ id: "existing" }),
    findUserById: async () => null,
    createUser: async () => {
      throw new Error("should not be called");
    },
    updateUser: async () => null,
  });

  await assert.rejects(
    () =>
      authService.register({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        tin: "123456789",
      }),
    (err) => err.status === 409 && err.message === "An account with that email already exists."
  );
});

test("login rejects invalid credentials and returns a token for valid users", async () => {
  const authService = createAuthService({
    findUserByEmail: async (email) =>
      email === "jane@example.com"
        ? {
            id: "user-1",
            email: "jane@example.com",
            name: "Jane Doe",
            passwordHash: "hashed-password",
          }
        : null,
    findUserById: async () => null,
    createUser: async () => null,
    updateUser: async () => null,
    comparePassword: async (password, hash) => password === "password123" && hash === "hashed-password",
    signToken: (user) => `token-${user.id}`,
  });

  const result = await authService.login({
    email: "jane@example.com",
    password: "password123",
  });
  assert.equal(result.token, "token-user-1");
  assert.equal(result.user.email, "jane@example.com");

  await assert.rejects(
    () =>
      authService.login({
        email: "jane@example.com",
        password: "wrong-password",
      }),
    (err) => err.status === 401
  );
});

test("database connectivity errors are surfaced as 503 responses", async () => {
  const authService = createAuthService({
    findUserByEmail: async () => {
      const err = new Error("Can't reach database server");
      err.code = "P1001";
      throw err;
    },
    findUserById: async () => null,
    createUser: async () => null,
    updateUser: async () => null,
  });

  await assert.rejects(
    () =>
      authService.login({
        email: "jane@example.com",
        password: "password123",
      }),
    (err) => err.status === 503 && err.message === "Database connection failed. Please try again shortly."
  );
});

