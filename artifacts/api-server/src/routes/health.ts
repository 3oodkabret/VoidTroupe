import { Router, type IRouter } from "express";
import {
  connectionString,
  getDatabaseConnectionHints,
  pingDatabase,
} from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getSafeHost(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  const result = await pingDatabase();

  if (result.ok) {
    res.json({
      status: "ok",
      database: "connected",
      host: getSafeHost(connectionString),
    });
    return;
  }

  res.status(503).json({
    status: "error",
    database: "disconnected",
    host: getSafeHost(connectionString),
    code: result.code ?? null,
    message: result.message,
    hints: result.hints.length > 0 ? result.hints : getDatabaseConnectionHints(connectionString),
  });
});

export default router;
