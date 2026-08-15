import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export function formatTin(rawTin) {
  const digits = String(rawTin || "").replace(/\D/g, "");
  if (digits.length !== 9) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

export function isUniqueConstraintError(err) {
  return err?.code === "P2002";
}

export function isDatabaseConnectivityError(err) {
  const message = String(err?.message || "");
  return (
    err?.code === "P1000" ||
    err?.code === "P1001" ||
    err?.code === "P1002" ||
    err?.code === "P1003" ||
    err?.code === "P1017" ||
    err?.code === "P2024" ||
    message.includes("Can't reach database server") ||
    message.includes("Database connection failed") ||
    message.includes("Authentication failed") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ETIMEDOUT") ||
    message.includes("Connection terminated unexpectedly") ||
    message.includes("[Database Config Error]")
  );
}


export function createAuthService({
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  hashPassword = (password) => bcrypt.hash(password, 10),
  comparePassword = (password, hash) => bcrypt.compare(password, hash),
  signToken = defaultSignToken,
} = {}) {
  assertDependency(findUserByEmail, "findUserByEmail");
  assertDependency(findUserById, "findUserById");
  assertDependency(createUser, "createUser");
  assertDependency(updateUser, "updateUser");

  return {
    async register({ name, email, password, tin }) {
      const cleanEmail = normalizeEmail(email);
      const cleanName = String(name || "").trim();
      const formattedTin = formatTin(tin);

      if (!cleanName) {
        throw createHttpError(400, "Full name is required.");
      }
      if (!cleanEmail) {
        throw createHttpError(400, "Valid email address is required.");
      }
      if (!password || String(password).length < 8) {
        throw createHttpError(400, "Password must be at least 8 characters.");
      }
      if (!formattedTin) {
        throw createHttpError(400, "TIN must be a valid 9-digit TRA Taxpayer Identification Number.");
      }

      let existingUser;
      try {
        existingUser = await findUserByEmail(cleanEmail);
      } catch (err) {
        throw mapDatabaseError(err, "Unable to verify whether this email is already registered.");
      }

      if (existingUser) {
        throw createHttpError(409, "An account with that email already exists.");
      }

      let passwordHash;
      try {
        passwordHash = await hashPassword(password);
      } catch (err) {
        throw createHttpError(500, "Unable to secure the password for this account.");
      }

      try {
        const user = await createUser({
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          authProvider: "password",
          tin: formattedTin,
        });

        return {
          token: signToken(user),
          user: publicUser(user),
        };
      } catch (err) {
        if (isUniqueConstraintError(err)) {
          throw createHttpError(409, "An account with that email already exists.");
        }
        throw mapDatabaseError(err, "Unable to create the account right now.");
      }
    },

    async login({ email, password }) {
      const cleanEmail = normalizeEmail(email);
      if (!cleanEmail) {
        throw createHttpError(400, "Valid email address is required.");
      }
      if (!password) {
        throw createHttpError(400, "Password is required.");
      }

      let user;
      try {
        user = await findUserByEmail(cleanEmail);
      } catch (err) {
        throw mapDatabaseError(err, "Unable to verify your account right now.");
      }

      if (!user || !user.passwordHash) {
        throw createHttpError(401, "Invalid email or password.");
      }

      let validPassword = false;
      try {
        validPassword = await comparePassword(password, user.passwordHash);
      } catch (err) {
        throw createHttpError(500, "Unable to validate the password right now.");
      }

      if (!validPassword) {
        throw createHttpError(401, "Invalid email or password.");
      }

      return {
        token: signToken(user),
        user: publicUser(user),
      };
    },

    async me(userId) {
      if (!userId) {
        throw createHttpError(401, "Unauthorized.");
      }

      let user;
      try {
        user = await findUserById(userId);
      } catch (err) {
        throw mapDatabaseError(err, "Unable to load the current user.");
      }

      if (!user) {
        throw createHttpError(404, "User not found.");
      }

      return {
        user: publicUser(user),
        hasValidTin: Boolean(formatTin(user.tin)),
      };
    },

    async updateTin(userId, tin) {
      if (!userId) {
        throw createHttpError(401, "Unauthorized.");
      }

      const formattedTin = formatTin(tin);
      if (!formattedTin) {
        throw createHttpError(
          400,
          "TIN must be a valid 9-digit TRA Taxpayer Identification Number (e.g. 123-456-789 or 123456789)."
        );
      }

      let updatedUser;
      try {
        updatedUser = await updateUser(userId, { tin: formattedTin });
      } catch (err) {
        throw mapDatabaseError(err, "Unable to update your TIN right now.");
      }

      if (!updatedUser) {
        throw createHttpError(404, "User not found.");
      }

      return {
        user: publicUser(updatedUser),
        hasValidTin: true,
      };
    },
  };
}

function normalizeEmail(email) {
  const clean = String(email || "").trim().toLowerCase();
  return clean || null;
}

function defaultSignToken(user) {
  const jwtSecret = process.env.JWT_SECRET || "tax-copilot-dev-secret-key-2026";
  return jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function createHttpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function mapDatabaseError(err, fallbackMessage) {
  if (isDatabaseConnectivityError(err)) {
    return createHttpError(503, "Database connection failed. Please try again shortly.");
  }

  if (err?.status) {
    return err;
  }

  return createHttpError(500, fallbackMessage);
}

function assertDependency(fn, name) {
  if (typeof fn !== "function") {
    throw new TypeError(`Auth service requires a ${name} function.`);
  }
}
