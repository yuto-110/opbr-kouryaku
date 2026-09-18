import { useEffect, useState } from "react";
import {
  Shield,
  UserRound,
  Settings,
  LogOut,
  RefreshCw,
  Star,
  Gamepad2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  GuideShell,
  PageIntro,
  SidebarCard,
} from "@/components/guide-shell";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://opbr-kouryaku-api.onrender.com/api";

const TOKEN_KEY = "opbr_access_token";

type User = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
};

type OwnedCharacter = {
  characterId: string;
  stars: number;
  level: number;
  boostLevel: number;
};

type Character = {
  id: string;
  name: string;
  reading?: string;
  imageUrl?: string;
  attribute?: {
    base: string;
    changesTo?: string;
  };
  role?: {
    base: string;
    changesTo?: string;
  };
  rarity?: string;
  tier?: string;
};

type MeResponse = {
  user: User;
  ownedCharacters: OwnedCharacter[];
  favoriteCharacters: string[];
  savedSupportTeams: unknown[];
  savedMedalTeams: unknown[];
};

export default function MyPage() {
  const [, navigate] = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [ownedCharacters, setOwnedCharacters] = useState<
    OwnedCharacter[]
  >([]);
  const [favoriteCharacters, setFavoriteCharacters] = useState<string[]>([]);
  const [characterMap, setCharacterMap] = useState<
    Record<string, Character>
  >({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null;

  const loadMyPage = async () => {
    if (!token) {
      navigate("/auth");
      return;
    }

    setError("");

    try {
      const meResponse = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (meResponse.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        navigate("/auth");
        return;
      }

      if (!meResponse.ok) {
        throw new Error("ユーザー情報の取得に失敗しました");
      }

      const meData: MeResponse = await meResponse.json();

      setUser(meData.user);
      setOwnedCharacters(meData.ownedCharacters ?? []);
      setFavoriteCharacters(meData.favoriteCharacters ?? []);

      /*
       * 所持キャラクターのIDから実際のキャラクターデータを取得
       */
      const characterResponse = await fetch(
        `${API_BASE_URL}/characters`,
      );

      if (characterResponse.ok) {
        const characterData = await characterResponse.json();

        const characters: Character[] = Array.isArray(characterData)
          ? characterData
          : characterData.characters ?? [];

        const map: Record<string, Character> = {};

        for (const character of characters) {
          map[character.id] = character;
          map[character.id.toLowerCase()] = character;
        }

        setCharacterMap(map);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "データの取得に失敗しました",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMyPage();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMyPage();
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate("/auth");
  };

  if (loading) {
    return (
      <GuideShell>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-sm text-muted-foreground">
            マイページを読み込んでいます...
          </div>
        </div>
      </GuideShell>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <GuideShell>
      <PageIntro
        eyebrow="PERSONAL ARCHIVE"
        title="マイページ"
        description="あなたのアカウント情報と所持キャラクターを管理します。"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-bold hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              同期
            </button>

            {user.role === "admin" && (
              <Link
                href="/admin/characters"
                className="flex items-center gap-2 rounded-sm bg-primary px-3 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                <Shield size={14} />
                管理画面
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 text-xs font-bold hover:border-destructive hover:text-destructive"
            >
              <LogOut size={14} />
              ログアウト
            </button>
          </div>
        }
      />

      {error && (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          {/* ユーザープロフィール */}
          <section className="rounded-md border border-card-border bg-card p-5 shadow-card sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 place-items-center rounded-sm bg-sidebar text-white">
                <UserRound size={30} />
              </div>

              <div className="flex-1">
                <div className="data-label">
                  PLAYER PROFILE
                </div>

                <h2 className="mt-1 text-lg font-black">
                  {user.username}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {user.email}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-sm bg-muted px-2 py-1 text-[10px] font-bold">
                    USER ID: {user.id}
                  </span>

                  {user.role === "admin" && (
                    <span className="rounded-sm bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-7 sm:pt-0">
                <span className="data-label">
                  OWNED CHARACTERS
                </span>

                <p className="mt-1 font-data text-2xl font-semibold text-primary">
                  {ownedCharacters.length}
                </p>
              </div>
            </div>
          </section>

          {/* 所持キャラクター */}
          <section className="mt-8">
            <div className="mb-4">
              <div className="data-label">
                MY CHARACTERS
              </div>

              <h2 className="mt-1 text-lg font-black">
                所持キャラクター
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                MongoDBに保存されている現在の所持状況です。
              </p>
            </div>

            {ownedCharacters.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
                <Gamepad2
                  size={30}
                  className="mx-auto text-muted-foreground"
                />

                <p className="mt-3 text-sm font-bold">
                  まだキャラクターを登録していません
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  キャラクター一覧から所持キャラクターを追加できます。
                </p>

                <Link
                  href="/characters"
                  className="mt-4 inline-flex rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white"
                >
                  キャラクター一覧を見る
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {ownedCharacters.map((owned) => {
                  const character =
                    characterMap[owned.characterId] ?? characterMap[owned.characterId.toLowerCase()];

                  return (
                    <div
                      key={owned.characterId}
                      className="rounded-md border border-card-border bg-card p-4 shadow-card"
                    >
                      <div className="flex gap-4">
                        {character?.imageUrl ? (
                          <img
                            src={character.imageUrl}
                            alt={character.name}
                            className="h-20 w-20 rounded-sm object-cover"
                          />
                        ) : (
                          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-sm bg-muted text-muted-foreground">
                            <Gamepad2 size={25} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-black">
                                {character?.name ??
                                  owned.characterId}
                              </p>

                              {character?.reading && (
                                <p className="text-[10px] text-muted-foreground">
                                  {character.reading}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-xs font-black text-primary">
                              <Star
                                size={13}
                                fill="currentColor"
                              />
                              {owned.stars}
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-sm bg-muted p-2">
                              <p className="text-[9px] text-muted-foreground">
                                LEVEL
                              </p>

                              <p className="font-data text-sm font-bold">
                                Lv.{owned.level}
                              </p>
                            </div>

                            <div className="rounded-sm bg-muted p-2">
                              <p className="text-[9px] text-muted-foreground">
                                BOOST
                              </p>

                              <p className="font-data text-sm font-bold">
                                +{owned.boostLevel}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {character && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                          {character.attribute?.base && (
                            <span className="rounded-sm bg-muted px-2 py-1 text-[9px] font-bold">
                              {character.attribute.base}
                            </span>
                          )}

                          {character.role?.base && (
                            <span className="rounded-sm bg-muted px-2 py-1 text-[9px] font-bold">
                              {character.role.base}
                            </span>
                          )}

                          {character.tier && (
                            <span className="rounded-sm bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">
                              {character.tier}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* お気に入りキャラクター */}
          <section className="mt-8">
            <div className="mb-4">
              <div className="data-label">FAVORITE CHARACTERS</div>
              <h2 className="mt-1 text-lg font-black">お気に入りキャラクター</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                所持していないキャラクターもお気に入り登録できます。
              </p>
            </div>

            {favoriteCharacters.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-card p-8 text-center">
                <Star size={30} className="mx-auto text-muted-foreground" />
                <p className="mt-3 text-sm font-bold">お気に入りはまだありません</p>
                <Link
                  href="/characters"
                  className="mt-4 inline-flex rounded-sm bg-primary px-4 py-2 text-xs font-bold text-white"
                >
                  キャラクター一覧を見る
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {favoriteCharacters.map((characterId) => {
                  const character = characterMap[characterId] ?? characterMap[characterId.toLowerCase()];
                  if (!character) return null;
                  const isOwned = ownedCharacters.some(
                    (item) => item.characterId === characterId,
                  );

                  return (
                    <Link
                      key={characterId}
                      href={`/characters/${characterId}`}
                      className="flex gap-3 rounded-md border border-card-border bg-card p-3 shadow-card hover:border-primary"
                    >
                      {character.imageUrl ? (
                        <img
                          src={character.imageUrl}
                          alt={character.name}
                          className="h-16 w-16 shrink-0 rounded-sm object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-sm bg-muted text-muted-foreground">
                          <Gamepad2 size={22} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-black">{character.name}</p>
                          <Star size={15} fill="currentColor" className="shrink-0" />
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {isOwned ? "所持中" : "未所持"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <SidebarCard title="アカウント情報">
            <div className="space-y-3">
              <div>
                <p className="data-label">USERNAME</p>
                <p className="mt-1 text-sm font-bold">
                  {user.username}
                </p>
              </div>

              <div>
                <p className="data-label">EMAIL</p>
                <p className="mt-1 break-all text-xs">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="data-label">ROLE</p>
                <p className="mt-1 text-sm font-bold">
                  {user.role === "admin"
                    ? "管理者"
                    : "一般ユーザー"}
                </p>
              </div>
            </div>
          </SidebarCard>

          {user.role === "admin" && (
            <div className="rounded-md border border-primary/20 bg-blue-50 p-4">
              <Shield
                size={20}
                className="text-primary"
              />

              <p className="mt-3 text-xs font-black">
                管理者アカウント
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-900/70">
                キャラクターなどの攻略データを管理できます。
              </p>

              <Link
                href="/admin/characters"
                className="mt-3 inline-flex w-full items-center justify-center rounded-sm bg-primary px-3 py-2 text-xs font-bold text-white"
              >
                管理画面を開く
              </Link>
            </div>
          )}

          <div className="rounded-md border border-card-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Settings size={16} />
              <p className="text-xs font-black">
                データ同期について
              </p>
            </div>

            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              マイページを開いたときにMongoDBから最新データを取得します。
              「同期」ボタンから手動で再取得することもできます。
            </p>
          </div>
        </aside>
      </div>
    </GuideShell>
  );
}