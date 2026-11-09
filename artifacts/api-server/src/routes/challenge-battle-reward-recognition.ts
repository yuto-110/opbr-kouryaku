import { GoogleGenAI } from "@google/genai";
import { Router, type IRouter } from "express";
import { ChallengeRewardItem, Medal, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import { toMedalItem, toStoredItem } from "../lib/reward-items";

const router: IRouter = Router();
const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

type RecognitionRequest = {
  passType?: "lite" | "premium";
  images?: { contentType?: string; contentBase64?: string }[];
};

const rewardSchema = {
  type: "OBJECT",
  properties: {
    rewards: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          score: { type: "INTEGER" },
          kind: { type: "STRING", enum: ["normal", "passLite", "passPremium"] },
          itemId: { type: "STRING" },
          quantity: { type: "INTEGER" },
          sourceImageIndexes: { type: "ARRAY", items: { type: "INTEGER" } },
          status: { type: "STRING", enum: ["recognized", "needs_review", "failed"] },
          note: { type: "STRING" },
        },
        required: [
          "score",
          "kind",
          "itemId",
          "quantity",
          "sourceImageIndexes",
          "status",
          "note",
        ],
      },
    },
  },
  required: ["rewards"],
} as const;

router.post(
  "/admin/challenge-battles/recognize-rewards",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const body = req.body as RecognitionRequest;
      if (body.passType !== "lite" && body.passType !== "premium") {
        return res.status(400).json({ message: "パス種別が正しくありません" });
      }
      if (
        !Array.isArray(body.images) ||
        body.images.length < 2 ||
        body.images.length > MAX_IMAGES
      ) {
        return res.status(400).json({
          message: `画像は2〜${MAX_IMAGES}枚選択してください`,
        });
      }
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({
          message: "画像認識を利用するには API 側に GEMINI_API_KEY を設定してください",
          code: "OCR_NOT_CONFIGURED",
        });
      }

      const images = body.images.map((image) => {
        const contentType = String(image.contentType ?? "");
        const contentBase64 = String(image.contentBase64 ?? "");
        if (!allowedTypes.has(contentType) || !contentBase64) {
          throw new Error("画像形式または画像データが正しくありません");
        }
        const buffer = Buffer.from(contentBase64, "base64");
        if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
          throw new Error("画像サイズは2MB以下にしてください");
        }
        return { contentType, contentBase64 };
      });

      await connectDB();
      const [storedItems, medals] = await Promise.all([
        ChallengeRewardItem.find().lean(),
        Medal.find().select("id name imageUrl active").lean(),
      ]);
      const itemCatalog = [
        ...storedItems.map(toStoredItem),
        ...medals.map(toMedalItem),
      ].map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        imageUrl: item.imageUrl,
      }));

      const prompt = `OPBRのチャレンジバトル報酬一覧を読み取ってください。入力画像は横長画面の連続した${images.length}枚です。画像間の重複列は同じスコアとして照合し、画像に存在しないスコアは追加しないでください。
この依頼はイベントパス${body.passType === "lite" ? "ライト" : "プレミアム"}画像です。通常報酬は normal、指定パス専用行は ${body.passType === "lite" ? "passLite" : "passPremium"} としてください。別パスの報酬や画面下部の購入特典は読み取らないでください。
スコア、個数は画像の文字をそのまま厳密に読み、判別できない場合は status を needs_review にしてください。アイコンと文字をカタログと照合し、確実に一致する itemId だけを使用してください。不一致は itemId を空文字にしてください。
画像の端が見切れている、同じスコアの報酬内容が一致しない、または文字・個数が不明瞭な場合は必ず needs_review にしてください。
利用可能なアイテムカタログ: ${JSON.stringify(itemCatalog)}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite",
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            ...images.map((image) => ({
              inlineData: {
                mimeType: image.contentType,
                data: image.contentBase64,
              },
            })),
          ],
        }],
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: rewardSchema,
        },
      });

      const raw = response.text;
      if (!raw) return res.status(502).json({ message: "画像認識結果が空でした" });

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(502).json({ message: "画像認識結果の形式が不正です" });
      }
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Array.isArray((parsed as { rewards?: unknown }).rewards)
      ) {
        return res.status(502).json({ message: "画像認識結果に報酬一覧がありません" });
      }

      const catalogIds = new Set(itemCatalog.map((item) => item.id));
      const allowedKinds = new Set([
        "normal",
        body.passType === "lite" ? "passLite" : "passPremium",
      ]);
      const rawRewards = (parsed as { rewards: unknown[] }).rewards;
      const rewards = rawRewards.flatMap((entry) => {
            if (!entry || typeof entry !== "object") return [];
            const value = entry as Record<string, unknown>;
            const score = Number(value.score);
            const quantity = Number(value.quantity);
            const kind = String(value.kind ?? "");
            if (
              !Number.isSafeInteger(score) ||
              !Number.isSafeInteger(quantity) ||
              !Array.isArray(value.sourceImageIndexes) ||
              typeof value.status !== "string" ||
              typeof value.note !== "string"
            ) {
              return [];
            }
            const itemId =
              typeof value.itemId === "string" && catalogIds.has(value.itemId)
                ? value.itemId
                : "";
            if (!Number.isSafeInteger(score) || score < 0 || !allowedKinds.has(kind)) {
              return [];
            }
            return [{
              score,
              kind,
              itemId,
              quantity:
                Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0,
              sourceImageIndexes: Array.isArray(value.sourceImageIndexes)
                ? value.sourceImageIndexes.filter(
                    (index): index is number =>
                      Number.isInteger(index) &&
                      index >= 0 &&
                      index < images.length,
                  )
                : [],
              status:
                value.status === "recognized" && itemId && quantity > 0
                  ? "recognized"
                  : "needs_review",
              note: typeof value.note === "string" ? value.note : "",
            }];
          });
      if (rewards.length !== rawRewards.length) {
        return res.status(502).json({ message: "画像認識結果に不正な報酬データがあります" });
      }
      return res.json({ rewards, itemCatalog });
    } catch (error) {
      const providerMessage = error instanceof Error ? error.message : "";
      const providerStatus =
        typeof error === "object" &&
        error &&
        "status" in error &&
        typeof (error as { status?: unknown }).status === "number"
          ? (error as { status: number }).status
          : 0;
      const status = providerStatus === 429 || /429|quota|rate limit/i.test(providerMessage)
        ? 429
        : providerStatus === 401 ||
            providerStatus === 403 ||
            /401|403|api key|authentication/i.test(providerMessage)
          ? 502
          : 400;
      console.error("[challenge-battle-reward-recognition] failed:", status, providerMessage);
      return res.status(status).json({
        message:
          status === 429
            ? "Gemini APIの無料枠またはレート上限に達しました。時間を置いて再試行してください"
            : status === 502
              ? "Gemini APIの認証に失敗しました。GEMINI_API_KEYを確認してください"
              : providerMessage || "画像認識に失敗しました",
      });
    }
  },
);

export default router;
