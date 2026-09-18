import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import charactersRouter from "./characters";
import ownedCharactersRouter from "./owned-characters";
import usersRouter from "./users";
import uploadsRouter from "./uploads";
import favoritesRouter from "./favorites";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(charactersRouter);
router.use(ownedCharactersRouter);
router.use(usersRouter);
router.use(uploadsRouter);
router.use(favoritesRouter);

export default router;