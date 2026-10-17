import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { connectDB, getConnection } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const SERVICE_NAME = "opbr-kouryaku-api";

/**
 * 外部監視用：プロセスが応答できるかだけを確認する（認証不要・DBに触れない）。
 * 秘密情報や環境変数の値は返さない。HEAD リクエストも Express が自動で処理する。
 */
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.set("Cache-Control", "no-store");
  res.status(200).json({
    ...data,
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 手動確認用：MongoDBへの接続と ping を確認する。
 * 外部サービスに触れるため、5分ごとの定期監視には使わず、障害調査のときだけ使う。
 */
router.get("/healthz/db", async (_req, res) => {
  res.set("Cache-Control", "no-store");

  try {
    await connectDB();
    const db = getConnection().db;
    if (!db) {
      throw new Error("MongoDB connection is not ready");
    }
    await db.command({ ping: 1 });

    res.status(200).json({
      status: "ok",
      service: SERVICE_NAME,
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, "Database health check failed");
    res.status(503).json({
      status: "error",
      service: SERVICE_NAME,
      database: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
