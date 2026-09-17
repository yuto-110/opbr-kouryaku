import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "@workspace/db";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: "admin" | "user";
  };
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return secret;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const token = authorization.slice("Bearer ".length);

    const payload = jwt.verify(token, getJwtSecret());

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.userId !== "string"
    ) {
      return res.status(401).json({
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
      });
    }

    const user = await User.findById(payload.userId).select(
      "_id username role",
    );

    if (!user) {
      return res.status(401).json({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    next();
  } catch {
    return res.status(401).json({
      code: "INVALID_TOKEN",
      message: "Invalid or expired authentication token",
    });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  next();
}
