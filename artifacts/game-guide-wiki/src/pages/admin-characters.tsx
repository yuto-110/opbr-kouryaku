import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Save, ShieldAlert } from 'lucide-react';
import { Link } from 'wouter';
import { GuideShell, PageIntro } from '@/components/guide-shell';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'https://opbr-kouryaku-api.onrender.com/api';

const ATTRIBUTE_OPTIONS = ['赤', '青', '緑', '黒', '白'] as const;
const ROLE_OPTIONS = ['アタッカー', 'ゲッター', 'ディフェンダー'] as const;
const RARITY_OPTIONS = ['レジェンダリー', '超レジェンダリー', '恒常'] as const;
const STAR_OPTIONS = [2, 3, 4] as const;
const TIER_OPTIONS = ['SS', 'S+', 'S', 'A+', 'A', 'B+', 'B'] as const;

function JsonField({
  label,
  value,
  onChange,
  rows = 8,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
      />
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function parseJson(
  value: string,
  fieldName: string,
  fallback: unknown,
): unknown {
  if (!value.trim()) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${fieldName} のJSON形式が正しくありません`);
  }
}

export default function AdminCharactersPage() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem('opbr_admin_token') ?? '',
  );

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [reading, setReading] = useState('');
  const [implementedAt, setImplementedAt] = useState('');

  const [attributeBase, setAttributeBase] = useState('赤');
  const [attributeChangesTo, setAttributeChangesTo] = useState('');

  const [roleBase, setRoleBase] = useState('アタッカー');
  const [roleChangesTo, setRoleChangesTo] = useState('');

  const [rarity, setRarity] = useState('レジェンダリー');
  const [initialStars, setInitialStars] = useState('4');
  const [tier, setTier] = useState('SS');
  const [teamBoost, setTeamBoost] = useState('');

  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [stats, setStats] = useState(`{
  "totalPower": 0,
  "hp": 0,
  "attack": 0,
  "defense": 0,
  "critical": 0
}`);

  const [levelStats, setLevelStats] = useState(`{
  "1": {
    "totalPower": 0,
    "hp": 0,
    "attack": 0,
    "defense": 0,
    "critical": 0
  },
  "100": {
    "totalPower": 0,
    "hp": 0,
    "attack": 0,
    "defense": 0,
    "critical": 0
  }
}`);

  const [level100Overboost, setLevel100Overboost] = useState(`{
  "hp": 0,
  "attack": 0,
  "defense": 0,
  "critical": 0
}`);

  const [skills, setSkills] = useState(`[]`);
  const [traits, setTraits] = useState(`[]`);
  const [characterTypes, setCharacterTypes] = useState(`[]`);

  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [recommendedMedals, setRecommendedMedals] = useState('');
  const [relatedCharacters, setRelatedCharacters] = useState('');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function saveToken(value: string) {
    setToken(value);

    if (value.trim()) {
      sessionStorage.setItem('opbr_admin_token', value.trim());
    } else {
      sessionStorage.removeItem('opbr_admin_token');
    }
  }

  function splitLines(value: string) {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (!token.trim()) {
        throw new Error('管理者トークンを入力してください');
      }

      if (!id.trim() || !name.trim() || !reading.trim()) {
        throw new Error('ID・名前・読み仮名は必須です');
      }

      const payload = {
        id: id.trim().toLowerCase(),
        name: name.trim(),
        reading: reading.trim(),

        attribute: {
          base: attributeBase,
          ...(attributeChangesTo
            ? { changesTo: attributeChangesTo }
            : {}),
        },

        role: {
          base: roleBase,
          ...(roleChangesTo
            ? { changesTo: roleChangesTo }
            : {}),
        },

        rarity,
        initialStars: Number(initialStars),
        tier,
        teamBoost: teamBoost.trim() || undefined,

        stats: parseJson(stats, '基本ステータス', {}),
        levelStats: parseJson(levelStats, 'レベル別ステータス', {}),
        level100Overboost: parseJson(
          level100Overboost,
          'Lv100オーバーブースト',
          undefined,
        ),

        skills: parseJson(skills, 'スキル', []),
        traits: parseJson(traits, '特性', []),
        characterTypes: parseJson(characterTypes, 'キャラクタータイプ', []),

        strengths: splitLines(strengths),
        weaknesses: splitLines(weaknesses),
        recommendedMedals: splitLines(recommendedMedals),
        relatedCharacters: splitLines(relatedCharacters),

        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,

        ...(implementedAt
          ? {
              implementedAt: new Date(
                `${implementedAt}T00:00:00`,
              ).toISOString(),
            }
          : {}),
      };

      const headers = new Headers();

      headers.set('Content-Type', 'application/json');
      headers.set('Authorization', `Bearer ${token.trim()}`);

      const response = await fetch(`${API_BASE_URL}/characters`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let data: unknown = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMessage =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : `キャラクター登録に失敗しました (${response.status})`;

        throw new Error(errorMessage);
      }

      setMessage(
        'キャラクターを登録しました。MongoDBへの保存が完了しています。',
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '登録中にエラーが発生しました',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <GuideShell>
      <div className="animate-enter">
        <Link
          href="/characters"
          className="mb-5 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft size={14} />
          キャラクター一覧に戻る
        </Link>

        <PageIntro
          eyebrow="ADMIN / CHARACTERS"
          title="キャラクター登録"
          description="MongoDBにキャラクター情報を登録します。管理者権限を持つJWTが必要です。"
        />

        <div className="mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-black">管理者専用ページ</p>
              <p className="mt-1 text-xs leading-5">
                JWTはブラウザのsessionStorageに保存されます。チャットや公開場所には貼らないでください。
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider text-muted-foreground">
              認証
            </h2>

            <TextField
              label="管理者JWT"
              value={token}
              onChange={saveToken}
              placeholder="Bearerトークンの中身だけを入力"
            />
          </section>

          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider text-muted-foreground">
              基本情報
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="ID"
                value={id}
                onChange={setId}
                placeholder="例: luffy-gear5"
              />

              <TextField
                label="キャラクター名"
                value={name}
                onChange={setName}
                placeholder="例: ルフィ"
              />

              <TextField
                label="読み仮名"
                value={reading}
                onChange={setReading}
                placeholder="例: るふぃ"
              />

              <TextField
                label="実装日"
                type="date"
                value={implementedAt}
                onChange={setImplementedAt}
              />

              <SelectField
                label="初期属性"
                value={attributeBase}
                onChange={setAttributeBase}
                options={ATTRIBUTE_OPTIONS}
              />

              <TextField
                label="属性変化先（任意）"
                value={attributeChangesTo}
                onChange={setAttributeChangesTo}
                placeholder="例: 黒"
              />

              <SelectField
                label="初期役職"
                value={roleBase}
                onChange={setRoleBase}
                options={ROLE_OPTIONS}
              />

              <TextField
                label="役職変化先（任意）"
                value={roleChangesTo}
                onChange={setRoleChangesTo}
                placeholder="例: ゲッター"
              />

              <SelectField
                label="レアリティ"
                value={rarity}
                onChange={setRarity}
                options={RARITY_OPTIONS}
              />

              <SelectField
                label="初期★"
                value={initialStars}
                onChange={setInitialStars}
                options={STAR_OPTIONS.map(String)}
              />

              <SelectField
                label="Tier"
                value={tier}
                onChange={setTier}
                options={TIER_OPTIONS}
              />

              <TextField
                label="チームブースト（任意）"
                value={teamBoost}
                onChange={setTeamBoost}
                placeholder="例: 回復ブースト"
              />

              <div className="md:col-span-2">
                <TextField
                  label="画像URL（任意）"
                  value={imageUrl}
                  onChange={setImageUrl}
                  placeholder="https://..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black">
                    キャラクター説明
                  </span>
                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={5}
                    placeholder="キャラクターの特徴や基本評価"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider text-muted-foreground">
              ステータス
            </h2>

            <div className="grid gap-5 lg:grid-cols-2">
              <JsonField
                label="基本ステータス JSON"
                value={stats}
                onChange={setStats}
                rows={10}
              />

              <JsonField
                label="レベル別ステータス JSON"
                value={levelStats}
                onChange={setLevelStats}
                rows={10}
              />

              <div className="lg:col-span-2">
                <JsonField
                  label="Lv100オーバーブースト JSON"
                  value={level100Overboost}
                  onChange={setLevel100Overboost}
                  rows={8}
                />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider text-muted-foreground">
              スキル・特性
            </h2>

            <div className="grid gap-5 lg:grid-cols-2">
              <JsonField
                label="スキル JSON"
                value={skills}
                onChange={setSkills}
                rows={12}
                placeholder={`[
  {
    "name": "スキル1",
    "description": "効果",
    "cooldown": 10
  }
]`}
              />

              <JsonField
                label="特性 JSON"
                value={traits}
                onChange={setTraits}
                rows={12}
                placeholder={`[
  {
    "name": "特性1",
    "effect": "効果"
  }
]`}
              />

              <div className="lg:col-span-2">
                <JsonField
                  label="キャラクタータイプ JSON"
                  value={characterTypes}
                  onChange={setCharacterTypes}
                  rows={10}
                  placeholder={`[
  {
    "typeId": "type-id",
    "name": "タイプ名",
    "effect": "効果",
    "effectLevel": 1
  }
]`}
                />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-card-border bg-card p-6 shadow-card">
            <h2 className="mb-5 text-sm font-black uppercase tracking-wider text-muted-foreground">
              攻略情報
            </h2>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="block">
                  <span className="mb-2 block text-xs font-black">
                    長所
                  </span>
                  <textarea
                    value={strengths}
                    onChange={(event) =>
                      setStrengths(event.target.value)
                    }
                    rows={7}
                    placeholder={'1行に1項目\n高火力\n機動力が高い'}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-xs font-black">
                    短所
                  </span>
                  <textarea
                    value={weaknesses}
                    onChange={(event) =>
                      setWeaknesses(event.target.value)
                    }
                    rows={7}
                    placeholder={'1行に1項目\n耐久が低い'}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-xs font-black">
                    おすすめメダルID
                  </span>
                  <textarea
                    value={recommendedMedals}
                    onChange={(event) =>
                      setRecommendedMedals(event.target.value)
                    }
                    rows={7}
                    placeholder={'1行に1ID\nmedal-id-1\nmedal-id-2'}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>

              <div>
                <label className="block">
                  <span className="mb-2 block text-xs font-black">
                    関連キャラクターID
                  </span>
                  <textarea
                    value={relatedCharacters}
                    onChange={(event) =>
                      setRelatedCharacters(event.target.value)
                    }
                    rows={7}
                    placeholder={'1行に1ID\ncharacter-id-1\ncharacter-id-2'}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </label>
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <CheckCircle2 size={18} />
                {message}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? '登録中...' : 'キャラクターを登録'}
            </button>
          </div>
        </form>
      </div>
    </GuideShell>
  );
}