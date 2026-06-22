import { Router, type IRouter } from "express";
import { pingDatabase } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/healthz/db", async (_req, res) => {
  try {
    const connected = await pingDatabase();
    res.json({ status: connected ? "ok" : "error", database: connected ? "connected" : "disconnected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

export default router;
