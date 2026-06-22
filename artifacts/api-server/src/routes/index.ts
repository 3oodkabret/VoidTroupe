import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analyzeRouter from "./analyze";
import chatRouter from "./chat";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(chatRouter);
router.use(authRouter);

export default router;
