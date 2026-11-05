import { Router, type IRouter } from "express";
import { ChallengeRewardItem, Medal, connectDB } from "@workspace/db";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import { toMedalItem, toStoredItem } from "../lib/reward-items";

const router: IRouter = Router();
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

type RecognitionRequest = {
  passType?: "lite" | "premium";
  images?: { contentType?: string; contentBase64?: string }[];
};

function messageFromOpenAi(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const error = (data as { error?: { message?: unknown } }).error;
  return typeof error?.message === "string" ? error.message : "";
}

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
      if (!Array.isArray(body.images) || body.images.length < 2 || body.images.length > MAX_IMAGES) {
        return res.status(400).json({ message: "画像は2〜3枚選択してください" });
      }
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          message: "画像認識を利用するには API 側に OPENAI_API_KEY を設定してください",
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
          throw new Error("画像サイズは8MB以下にしてください");
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

      const content = [
        {
          type: "text",
          text: `OPBRのチャレンジバトル報酬一覧を読み取ってください。入力画像は横長画面の連続した${images.length}枚です。画像間の重複列は同じスコアとして照合し、画像に存在しないスコアは追加しないでください。
この依頼はイベントパス${body.passType === "lite" ? "ライト" : "プレミアム"}画像です。通常報酬は normal、指定パス専用行は ${body.passType === "lite" ? "passLite" : "passPremium"} としてください。別パスの報酬や画面下部の購入特典は読み取らないでください。
スコア、個数は画像の文字をそのまま厳密に読み、判別できない場合は status を needs_review にしてください。アイコンと文字をカタログと照合し、確実に一致する itemId だけを使用してください。不一致は itemId を空文字にしてください。
JSONのみを返してください。形式: {"rewards":[{"score":1250,"kind":"normal|passLite|passPremium","itemId":"カタログID","quantity":10,"sourceImageIndexes":[0],"status":"recognized|needs_review|failed","note":"短い理由"}]}
利用可能なアイテムカタログ: ${JSON.stringify(itemCatalog)}`,
        },
        ...images.map((image) => ({
          type: "image_url",
          image_url: {
            url: `data:${image.contentType};base64,${image.contentBase64}`,
            detail: "high",
          },
        })),
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini",
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "あなたはゲーム画面の報酬表を読む厳密な画像認識器です。推測せず、不明な値は needs_review にしてください。",
            },
            { role: "user", content },
          ],
        }),
      });
      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string };
      };
      if (!response.ok) {
        console.error("[challenge-battle-reward-recognition] OpenAI failed:", messageFromOpenAi(data));
        return res.status(502).json({ message: "画像認識サービスから結果を取得できませんでした" });
      }

      const raw = data.choices?.[0]?.message?.content;
      if (!raw) return res.status(502).json({ message: "画像認識結果が空でした" });
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return res.status(502).json({ message: "画像認識結果の形式が不正です" });
      }
      const catalogIds = new Set(itemCatalog.map((item) => item.id));
      const allowedKinds = new Set(["normal", body.passType === "lite" ? "passLite" : "passPremium"]);
      const rewards = Array.isArray((parsed as { rewards?: unknown })?.rewards)
        ? (parsed as { rewards: unknown[] }).rewards.flatMap((entry) => {
            if (!entry || typeof entry !== "object") return [];
            const value = entry as Record<string, unknown>;
            const score = Number(value.score);
            const quantity = Number(value.quantity);
            const kind = value.kind;
            const itemId = typeof value.itemId === "string" && catalogIds.has(value.itemId)
              ? value.itemId
              : "";
            if (!Number.isSafeInteger(score) || score < 0 || !allowedKinds.has(String(kind))) return [];
            return [{
              score,
              kind: String(kind),
              itemId,
              quantity: Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0,
              sourceImageIndexes: Array.isArray(value.sourceImageIndexes)
                ? value.sourceImageIndexes.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < images.length)
                : [],
              status: value.status === "recognized" && itemId && quantity > 0 ? "recognized" : "needs_review",
              note: typeof value.note === "string" ? value.note : "",
            }];
          })
        : [];
      return res.json({ rewards, itemCatalog });
    } catch (error) {
      console.error("[challenge-battle-reward-recognition] failed:", error);
      return res.status(400).json({
        message: error instanceof Error ? error.message : "画像認識に失敗しました",
      });
    }
  },
);

export default router;
