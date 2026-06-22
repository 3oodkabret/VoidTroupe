import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { randomBytes } from "node:crypto";
import { db } from "@workspace/db";
import { passwordResetTokensTable, usersTable } from "@workspace/db/schema";
import { and, eq, gt } from "drizzle-orm";
import {
  getBearerToken,
  hashPassword,
  signAuthToken,
  verifyAuthToken,
  verifyPassword,
} from "../lib/auth";
import { buildPasswordResetUrl, sendPasswordResetEmail } from "../lib/email";

const router: IRouter = Router();

type AuthUserResponse = {
  id: string;
  name: string;
  email: string;
};

function toAuthUser(user: { id: number; name: string; email: string }): AuthUserResponse {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
  };
}

function sendAuthResponse(
  res: Response,
  user: { id: number; name: string; email: string },
) {
  res.json({
    token: signAuthToken(user.id, user.email),
    user: toAuthUser(user),
  });
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req.header("authorization"));
  if (!token) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  req.auth = payload;
  next();
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        email: string;
        exp: number;
      };
    }
  }
}

router.post("/auth/register", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const [created] = await db
      .insert(usersTable)
      .values({
        name,
        email,
        passwordHash: hashPassword(password),
      })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      });

    sendAuthResponse(res, created);
  } catch (error) {
    req.log.error({ err: error }, "Register failed");
    res.status(500).json({ error: "Unable to create account right now." });
  }
});

router.post("/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        passwordHash: usersTable.passwordHash,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    sendAuthResponse(res, user);
  } catch (error) {
    req.log.error({ err: error }, "Login failed");
    res.status(500).json({ error: "Unable to sign in right now." });
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const genericMessage = "If your email exists, a reset link has been sent.";

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      res.json({ message: genericMessage });
      return;
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, user.id));
    await db.insert(passwordResetTokensTable).values({
      userId: user.id,
      token,
      expiresAt,
    });

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: buildPasswordResetUrl(token),
    });

    res.json({ message: genericMessage });
  } catch (error) {
    req.log.error({ err: error }, "Forgot password failed");
    res.status(500).json({ error: "Unable to send reset email right now." });
  }
});

router.post("/auth/reset-password", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!token || !password) {
    res.status(400).json({ error: "Reset token and new password are required." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  try {
    const [resetRecord] = await db
      .select({
        id: passwordResetTokensTable.id,
        userId: passwordResetTokensTable.userId,
      })
      .from(passwordResetTokensTable)
      .where(
        and(
          eq(passwordResetTokensTable.token, token),
          gt(passwordResetTokensTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!resetRecord) {
      res.status(400).json({ error: "This reset link is invalid or has expired." });
      return;
    }

    await db
      .update(usersTable)
      .set({ passwordHash: hashPassword(password) })
      .where(eq(usersTable.id, resetRecord.userId));

    await db.delete(passwordResetTokensTable).where(eq(passwordResetTokensTable.userId, resetRecord.userId));

    res.json({ message: "Your password has been reset successfully. You can now sign in." });
  } catch (error) {
    req.log.error({ err: error }, "Reset password failed");
    res.status(500).json({ error: "Unable to reset password right now." });
  }
});

router.patch("/auth/profile", requireAuth, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    res.status(400).json({ error: "Name is required." });
    return;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ name })
      .where(eq(usersTable.id, req.auth!.userId))
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      });

    if (!updated) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ user: toAuthUser(updated) });
  } catch (error) {
    req.log.error({ err: error }, "Profile update failed");
    res.status(500).json({ error: "Unable to update profile right now." });
  }
});

export default router;
