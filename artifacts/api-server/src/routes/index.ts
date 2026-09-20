import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import charactersRouter from "./characters";
import ownedCharactersRouter from "./owned-characters";
import usersRouter from "./users";
import uploadsRouter from "./uploads";
import favoritesRouter from "./favorites";
import characterTagsRouter from "./character-tags";
import characterIconsRouter from "./character-icons";
import medalsRouter from "./medals";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(charactersRouter);
router.use(ownedCharactersRouter);
router.use(usersRouter);
router.use(uploadsRouter);
router.use(favoritesRouter);
router.use(characterTagsRouter);
router.use(characterIconsRouter);
router.use(medalsRouter);

export default router;