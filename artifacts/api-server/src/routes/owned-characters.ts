import { Router, type IRouter } from 'express';
import {
  Character,
  CharacterGrowthRule,
  User,
  connectDB,
} from '@workspace/db';
import {
  requireAuth,
  type AuthenticatedRequest,
} from '../middlewares/auth';

const router: IRouter = Router();

/**
 * GET /users/me/characters
 *
 * 現在ログインしているユーザーの所持キャラクター一覧を取得
 */
router.get(
  '/users/me/characters',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      await connectDB();

      const user = await User.findById(req.user!.id).lean();

      if (!user) {
        return res.status(404).json({
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません',
        });
      }

      return res.json(user.ownedCharacters);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '所持キャラクターの取得に失敗しました',
      });
    }
  },
);

/**
 * POST /users/me/characters
 *
 * キャラクターを所持キャラクターに追加
 *
 * body:
 * {
 *   "characterId": "character-id"
 * }
 */
router.post(
  '/users/me/characters',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { characterId } = req.body;

      if (
        typeof characterId !== 'string' ||
        characterId.trim().length === 0
      ) {
        return res.status(400).json({
          code: 'INVALID_REQUEST',
          message: 'characterIdが正しくありません',
        });
      }

      await connectDB();

      const character = await Character.findOne({
        id: characterId,
      }).lean();

      if (!character) {
        return res.status(404).json({
          code: 'CHARACTER_NOT_FOUND',
          message: 'キャラクターが見つかりません',
        });
      }

      const user = await User.findById(req.user!.id);

      if (!user) {
        return res.status(404).json({
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません',
        });
      }

      const alreadyOwned = user.ownedCharacters.some(
        (ownedCharacter) =>
          ownedCharacter.characterId === characterId,
      );

      if (alreadyOwned) {
        return res.status(409).json({
          code: 'ALREADY_OWNED',
          message: 'このキャラクターは既に所持しています',
        });
      }

      const ownedCharacter = {
        characterId,
        stars: character.initialStars,
        level: 1,
        boostLevel: 0,
      };

      user.ownedCharacters.push(ownedCharacter);
      await user.save();

      return res.status(201).json(ownedCharacter);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '所持キャラクターの追加に失敗しました',
      });
    }
  },
);

/**
 * PUT /users/me/characters/:characterId
 *
 * 所持キャラクターの★・Lv・ブースト段階を更新
 *
 * body:
 * {
 *   "stars": 5,
 *   "level": 80,
 *   "boostLevel": 2
 * }
 */
router.put(
  '/users/me/characters/:characterId',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const characterId = req.params.characterId;
      const { stars, level, boostLevel } = req.body;

      if (
        !Number.isInteger(stars) ||
        stars < 2 ||
        stars > 6
      ) {
        return res.status(400).json({
          code: 'INVALID_STARS',
          message: '★は2〜6の整数で指定してください',
        });
      }

      if (
        !Number.isInteger(level) ||
        level < 1 ||
        level > 100
      ) {
        return res.status(400).json({
          code: 'INVALID_LEVEL',
          message: 'レベルは1〜100の整数で指定してください',
        });
      }

      if (
        !Number.isInteger(boostLevel) ||
        boostLevel < 0 ||
        boostLevel > 4
      ) {
        return res.status(400).json({
          code: 'INVALID_BOOST_LEVEL',
          message: 'ブースト段階は0〜4の整数で指定してください',
        });
      }

      // ブースト3・4はLv100で解放
      if (level < 100 && boostLevel >= 3) {
        return res.status(400).json({
          code: 'BOOST_LEVEL_REQUIRES_LEVEL_100',
          message: 'ブースト3以降はLv100で解放されます',
        });
      }

      await connectDB();

      const character = await Character.findOne({
        id: characterId,
      }).lean();

      if (!character) {
        return res.status(404).json({
          code: 'CHARACTER_NOT_FOUND',
          message: 'キャラクターが見つかりません',
        });
      }

      const growthRule = await CharacterGrowthRule.findOne({
        stars,
      }).lean();

      if (!growthRule) {
        return res.status(400).json({
          code: 'GROWTH_RULE_NOT_FOUND',
          message: `★${stars}の成長ルールが登録されていません`,
        });
      }

      if (level > growthRule.maxLevel) {
        return res.status(400).json({
          code: 'LEVEL_EXCEEDS_STAR_LIMIT',
          message: `★${stars}の最大レベルはLv${growthRule.maxLevel}です`,
          maxLevel: growthRule.maxLevel,
        });
      }

      const user = await User.findById(req.user!.id);

      if (!user) {
        return res.status(404).json({
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません',
        });
      }

      const ownedCharacter = user.ownedCharacters.find(
        (item) => item.characterId === characterId,
      );

      if (!ownedCharacter) {
        return res.status(404).json({
          code: 'NOT_OWNED',
          message: 'このキャラクターを所持していません',
        });
      }

      ownedCharacter.stars = stars;
      ownedCharacter.level = level;
      ownedCharacter.boostLevel = boostLevel;

      await user.save();

      return res.json(ownedCharacter);
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '所持キャラクターの更新に失敗しました',
      });
    }
  },
);

/**
 * DELETE /users/me/characters/:characterId
 *
 * 所持キャラクターから削除
 */
router.delete(
  '/users/me/characters/:characterId',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const characterId = req.params.characterId;

      await connectDB();

      const user = await User.findById(req.user!.id);

      if (!user) {
        return res.status(404).json({
          code: 'USER_NOT_FOUND',
          message: 'ユーザーが見つかりません',
        });
      }

      const index = user.ownedCharacters.findIndex(
        (item) => item.characterId === characterId,
      );

      if (index === -1) {
        return res.status(404).json({
          code: 'NOT_OWNED',
          message: 'このキャラクターを所持していません',
        });
      }

      user.ownedCharacters.splice(index, 1);
      await user.save();

      return res.status(204).send();
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: '所持キャラクターの削除に失敗しました',
      });
    }
  },
);

export default router;