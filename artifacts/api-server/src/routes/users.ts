import { Router, type IRouter } from "express";
import { User, connectDB } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

/**
 * ログイン中のユーザー情報取得
 * GET /users/me
 */
router.get(
  "/users/me",
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      await connectDB();

      if (!req.user) {
        return res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      const user = await User.findById(req.user.id).lean();

      if (!user) {
        return res.status(404).json({
          code: "USER_NOT_FOUND",
          message: "User not found",
        });
      }

      return res.json({
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
        },
        ownedCharacters: user.ownedCharacters ?? [],
        favoriteCharacters: user.favoriteCharacters ?? [],
        savedSupportTeams: user.savedSupportTeams ?? [],
        savedMedalTeams: user.savedMedalTeams ?? [],
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_ERROR",
        message: "サーバーエラーが発生しました",
      });
    }
  },
);

export default router;