import { useEffect, useState } from "react";
import { ArrowRight, Database, ShieldCheck, Swords, Tags } from "lucide-react";
import { Link, useLocation } from "wouter";
import { GuideShell, PageIntro } from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

const ACCESS_TOKEN_KEY = "opbr_access_token";

type MeResponse = {
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "user";
  };
};

type Character = {
  id: string;
  name: string;
};

export default function AdminPage() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<"loading" | "ready" | "forbidden" | "error">("loading");
  const [username, setUsername] = useState("");
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!token) {
      navigate("/auth");
      return;
    }

    async function load() {
      try {
        const meResponse = await fetch(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meResponse.ok) {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          navigate("/auth");
          return;
        }

        const me = (await meResponse.json()) as MeResponse;

        if (me.user.role !== "admin") {
          setState("forbidden");
          return;
        }

        setUsername(me.user.username);

        const charactersResponse = await fetch(`${API_BASE_URL}/characters`);

        if (charactersResponse.ok) {
          const characters = (await charactersResponse.json()) as Character[];
          setCharacterCount(characters.length);
        }

        setState("ready");
      } catch {
        setState("error");
      }
    }

    void load();
  }, [navigate]);

  if (state === "loading") {
    return <GuideShell><PageIntro eyebrow="ADMIN" title="管理画面" description="権限を確認しています…" /></GuideShell>;
  }

  if (state === "forbidden") {
    return (
      <GuideShell>
        <PageIntro
          eyebrow="ADMIN / 403"
          title="管理者権限が必要です"
          description="このページはadminロールのユーザーだけが利用できます。"
          action={<Link href="/" className="rounded-md bg-primary px-4 py-2 text-xs font-black text-white">ホームへ</Link>}
        />
      </GuideShell>
    );
  }

  if (state === "error") {
    return <GuideShell><PageIntro eyebrow="ADMIN / ERROR" title="管理画面を読み込めませんでした" description="APIサーバーの状態とログイン状態を確認してください。" /></GuideShell>;
  }

  return (
    <GuideShell>
      <PageIntro
        eyebrow="ADMIN / DASHBOARD"
        title="管理画面"
        description={`${username}さんの管理者ダッシュボード。MongoDBのゲームデータを管理します。`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/characters"
          className="group rounded-lg border border-card-border bg-card p-6 shadow-card transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary">
              <Swords size={21} />
            </div>
            <ArrowRight size={18} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <h2 className="mt-5 text-lg font-black">キャラクター管理</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            キャラクターの追加・編集・削除、画像登録、ステータス・スキル・特性を管理します。
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-primary">
            <Database size={14} />
            {characterCount}件登録
          </div>
        </Link>

        <Link
          href="/admin/character-tags"
          className="group rounded-lg border border-card-border bg-card p-6 shadow-card transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-amber-500/10 text-amber-600"><Tags size={21} /></div>
            <ArrowRight size={18} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </div>
          <h2 className="mt-5 text-lg font-black">キャラクタータグ管理</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">キャラタグの名前・説明・サポート時の効果を登録・編集します。</p>
        </Link>

        <div className="rounded-lg border border-card-border bg-card p-6 shadow-card">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-500/10 text-emerald-600">
            <ShieldCheck size={21} />
          </div>
          <h2 className="mt-5 text-lg font-black">管理者認証</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            管理画面はログイン中のJWTを使ってAPI側でadmin権限を確認します。一般ユーザーからadmin権限を取得することはできません。
          </p>
        </div>
      </div>
    </GuideShell>
  );
}
