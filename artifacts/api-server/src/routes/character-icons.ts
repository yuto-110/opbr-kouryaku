import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { CharacterIconMaster } from "@workspace/db";
import {
  requireAuth,
  requireAdmin,
  type AuthenticatedRequest,
} from "../middlewares/auth";

const router: IRouter = Router();

router.get("/character-icons", async (_req, res) => {
  const items = await CharacterIconMaster.find({ active: true })
    .sort({ name: 1 })
    .lean();
  return res.json(items);
});

router.get(
  "/admin/character-icons",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    const items = await CharacterIconMaster.find()
      .sort({ name: 1 })
      .lean();
    return res.json(items);
  },
);

router.post(
  "/admin/character-icons",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, imageUrl } = req.body as {
        name?: string;
        imageUrl?: string;
      };
      if (!name?.trim() || !imageUrl?.trim()) {
        return res.status(400).json({ message: "名前と画像URLは必須です" });
      }
      const item = await CharacterIconMaster.create({
        id: `icon-${randomUUID().replace(/-/g, "").slice(0, 12)}`,
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        active: true,
      });
      return res.status(201).json(item);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: "キャラアイコンの登録に失敗しました" });
    }
  },
);

router.put(
  "/admin/character-icons/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { name, imageUrl, active } = req.body as {
        name?: string;
        imageUrl?: string;
        active?: boolean;
      };
      const item = await CharacterIconMaster.findOneAndUpdate(
        { id: req.params.id },
        {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(imageUrl !== undefined ? { imageUrl: imageUrl.trim() } : {}),
          ...(active !== undefined ? { active } : {}),
        },
        { new: true, runValidators: true },
      ).lean();
      if (!item) return res.status(404).json({ message: "アイコンが見つかりません" });
      return res.json(item);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ message: "キャラアイコンの更新に失敗しました" });
    }
  },
);

router.delete(
  "/admin/character-icons/:id",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const item = await CharacterIconMaster.findOneAndDelete({
      id: req.params.id,
    }).lean();
    if (!item) return res.status(404).json({ message: "アイコンが見つかりません" });
    return res.json({ ok: true });
  },
);

export default router;
