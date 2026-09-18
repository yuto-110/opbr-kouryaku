import { Router, type IRouter } from "express";
import { Character, User, connectDB } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/users/me/favorites", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    await connectDB();
    const user = await User.findById(req.user!.id).lean();
    if (!user) return res.status(404).json({ code: "USER_NOT_FOUND", message: "ユーザーが見つかりません" });
    return res.json(user.favoriteCharacters ?? []);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "お気に入りの取得に失敗しました" });
  }
});

router.post("/users/me/favorites/:characterId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const characterId = String(req.params.characterId ?? "").trim().toLowerCase();
    if (!characterId) return res.status(400).json({ code: "INVALID_REQUEST", message: "characterIdが正しくありません" });
    await connectDB();
    const character = await Character.findOne({ id: characterId }).lean();
    if (!character) return res.status(404).json({ code: "CHARACTER_NOT_FOUND", message: "キャラクターが見つかりません" });
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ code: "USER_NOT_FOUND", message: "ユーザーが見つかりません" });
    if (!user.favoriteCharacters.includes(characterId)) {
      user.favoriteCharacters.push(characterId);
      await user.save();
    }
    return res.status(201).json({ characterId, favorite: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "お気に入りの追加に失敗しました" });
  }
});

router.delete("/users/me/favorites/:characterId", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const characterId = String(req.params.characterId ?? "").trim().toLowerCase();
    await connectDB();
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ code: "USER_NOT_FOUND", message: "ユーザーが見つかりません" });
    user.favoriteCharacters = user.favoriteCharacters.filter((id) => id !== characterId);
    await user.save();
    return res.json({ characterId, favorite: false });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ code: "INTERNAL_ERROR", message: "お気に入りの解除に失敗しました" });
  }
});

export default router;
