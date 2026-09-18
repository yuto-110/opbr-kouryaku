import { Router, type IRouter } from "express";
import {
  requireAuth,
  requireAdmin,
  type AuthenticatedRequest,
} from "../middlewares/auth";

const router: IRouter = Router();

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_OWNER = "yuto-110";
const GITHUB_REPO = "opbr-kouryaku-assets";
const GITHUB_BRANCH = "main";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const allowedFolders = [
  "characters",
  "medals",
  "team-boost",
  "skills",
] as const;

const allowedContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

function getGitHubToken(): string {
  const token = process.env.GITHUB_ASSETS_TOKEN;

  if (!token) {
    throw new Error(
      "GITHUB_ASSETS_TOKEN environment variable is not set",
    );
  }

  return token;
}

function isValidBase64(value: string): boolean {
  if (value.length === 0 || value.length % 4 !== 0) {
    return false;
  }

  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    value,
  );
}

async function githubRequest(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${getGitHubToken()}`,
      "X-GitHub-Api-Version": "2026-03-10",
      ...(init.headers ?? {}),
    },
  });
}

router.post(
  "/uploads/github",
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        folder,
        filename,
        contentType,
        contentBase64,
      } = req.body as {
        folder?: string;
        filename?: string;
        contentType?: string;
        contentBase64?: string;
      };

      if (
        !folder ||
        !allowedFolders.includes(
          folder as (typeof allowedFolders)[number],
        )
      ) {
        return res.status(400).json({
          error: "INVALID_FOLDER",
          message:
            "folderはcharacters、medals、team-boost、skillsのいずれかです",
        });
      }

      if (
        !filename ||
        filename.length > 100 ||
        !/^[a-zA-Z0-9._-]+$/.test(filename)
      ) {
        return res.status(400).json({
          error: "INVALID_FILENAME",
          message:
            "ファイル名に使用できない文字が含まれています",
        });
      }

      if (
        !contentType ||
        !allowedContentTypes.includes(
          contentType as (typeof allowedContentTypes)[number],
        )
      ) {
        return res.status(400).json({
          error: "INVALID_CONTENT_TYPE",
          message:
            "JPEG、PNG、WebP、AVIFのみ対応しています",
        });
      }

      if (!contentBase64 || !isValidBase64(contentBase64)) {
        return res.status(400).json({
          error: "INVALID_CONTENT",
          message: "画像データが正しくありません",
        });
      }

      const imageBuffer = Buffer.from(
        contentBase64,
        "base64",
      );

      if (
        imageBuffer.length === 0 ||
        imageBuffer.length > MAX_IMAGE_BYTES
      ) {
        return res.status(400).json({
          error: "IMAGE_TOO_LARGE",
          message: "画像サイズは8MB以下にしてください",
        });
      }

      const path = `${folder}/${filename}`;

      const encodedPath = path
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");

      // 既存ファイルがあるか確認
      const existingResponse = await githubRequest(
        `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(
          GITHUB_BRANCH,
        )}`,
      );

      let existingSha: string | undefined;

      if (existingResponse.ok) {
        const existing = (await existingResponse.json()) as {
          sha?: string;
        };

        existingSha = existing.sha;
      } else if (existingResponse.status !== 404) {
        const errorBody = await existingResponse.text();

        console.error(
          "GitHub existing-file check failed:",
          errorBody,
        );

        return res.status(502).json({
          error: "GITHUB_FILE_CHECK_FAILED",
          message:
            "GitHub上の画像確認に失敗しました",
        });
      }

      // GitHubへアップロード
      const response = await githubRequest(
        `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodedPath}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Upload image: ${path}`,
            content: imageBuffer.toString("base64"),
            branch: GITHUB_BRANCH,
            ...(existingSha
              ? { sha: existingSha }
              : {}),
          }),
        },
      );

      const responseBody = await response.text();

      let githubResult: {
        content?: {
          html_url?: string;
          download_url?: string | null;
        };
        message?: string;
      } = {};

      try {
        githubResult = JSON.parse(
          responseBody,
        ) as typeof githubResult;
      } catch {
        // GitHubがJSON以外を返した場合
      }

      if (!response.ok) {
        console.error(
          "GitHub image upload failed:",
          responseBody,
        );

        return res.status(502).json({
          error: "GITHUB_UPLOAD_FAILED",
          message:
            "GitHubへの画像アップロードに失敗しました",
        });
      }

      const publicUrl =
        githubResult.content?.download_url ??
        `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`;

      return res.status(existingSha ? 200 : 201).json({
        path,
        publicUrl,
        githubUrl:
          githubResult.content?.html_url,
      });
    } catch (error) {
      console.error(
        "Failed to upload image to GitHub:",
        error,
      );

      return res.status(500).json({
        error: "GITHUB_UPLOAD_ERROR",
        message:
          "画像アップロードに失敗しました",
      });
    }
  },
);

export default router;