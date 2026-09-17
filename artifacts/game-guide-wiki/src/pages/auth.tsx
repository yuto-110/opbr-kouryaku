import { type FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { Link, useLocation } from 'wouter';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'https://opbr-kouryaku-api.onrender.com/api';

const ACCESS_TOKEN_KEY = 'opbr_access_token';

export default function AuthPage() {
  const [, navigate] = useLocation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
    setMessage('');
    setPassword('');
    setPasswordConfirm('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setMessage('');

    if (isRegister && password !== passwordConfirm) {
      setError('パスワードが一致していません');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister
        ? '/auth/register'
        : '/auth/login';

      const body = isRegister
        ? {
            username: username.trim(),
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ??
            (isRegister
              ? 'アカウントを作成できませんでした'
              : 'ログインできませんでした'),
        );
      }

      if (!data?.accessToken) {
        throw new Error(
          'ログイン情報を受け取れませんでした',
        );
      }

      // ログイン状態を保存
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        data.accessToken,
      );

      if (isRegister) {
        setMessage(
          'アカウントを作成しました。ログイン状態でサイトを利用できます。',
        );
      } else {
        setMessage('ログインしました。');
      }

      // 少しだけメッセージを表示してマイページへ
      window.setTimeout(() => {
        navigate('/mypage');
      }, 500);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : '通信中にエラーが発生しました',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-md">

        {/* ロゴ */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-black tracking-tight"
          >
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-white">
              OP
            </span>

            OPBR攻略
          </Link>

          <p className="mt-5 text-[10px] font-bold tracking-[0.25em] text-primary">
            PLAYER ACCOUNT
          </p>

          <h1 className="mt-2 text-2xl font-black tracking-tight">
            {isRegister
              ? 'アカウントを作成'
              : 'ログイン'}
          </h1>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            手持ちキャラクターや編成を保存して、
            攻略データをもっと便利に使えます。
          </p>
        </div>

        <section className="rounded-lg border border-card-border bg-card p-5 shadow-card sm:p-7">

          {/* タブ */}
          <div className="mb-6 grid grid-cols-2 rounded-md bg-secondary p-1">

            <button
              type="button"
              onClick={() => changeMode('login')}
              className={`rounded-sm px-3 py-2 text-xs font-black transition ${
                !isRegister
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <LogIn size={14} />
                ログイン
              </span>
            </button>

            <button
              type="button"
              onClick={() => changeMode('register')}
              className={`rounded-sm px-3 py-2 text-xs font-black transition ${
                isRegister
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <UserPlus size={14} />
                新規登録
              </span>
            </button>

          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* ユーザー名 */}
            {isRegister && (
              <Field
                label="ユーザー名"
                value={username}
                onChange={setUsername}
                placeholder="3〜50文字"
                minLength={3}
                maxLength={50}
                required
              />
            )}

            {/* メール */}
            <Field
              label="メールアドレス"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@example.com"
              required
            />

            {/* パスワード */}
            <label className="block">
              <span className="mb-2 block text-xs font-black">
                パスワード
              </span>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  minLength={
                    isRegister ? 8 : undefined
                  }
                  maxLength={128}
                  placeholder={
                    isRegister
                      ? '8〜128文字'
                      : 'パスワードを入力'
                  }
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
                    )
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? 'パスワードを隠す'
                      : 'パスワードを表示'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </label>

            {/* パスワード確認 */}
            {isRegister && (
              <label className="block">
                <span className="mb-2 block text-xs font-black">
                  パスワード（確認）
                </span>

                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) =>
                    setPasswordConfirm(
                      event.target.value,
                    )
                  }
                  minLength={8}
                  maxLength={128}
                  placeholder="もう一度入力"
                  required
                  className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
            )}

            {/* エラー */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold leading-5 text-red-700">
                {error}
              </div>
            )}

            {/* 成功 */}
            {message && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold leading-5 text-emerald-700">
                {message}
              </div>
            )}

            {/* 送信 */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? '処理中…'
                : isRegister
                  ? 'アカウントを作成する'
                  : 'ログインする'}

              {!loading && (
                <ArrowRight size={16} />
              )}
            </button>

          </form>
        </section>

        <p className="mt-5 text-center text-[10px] leading-5 text-muted-foreground">
          パスワードはサーバー側で安全にハッシュ化して保存されます。
          <br />
          管理者権限は新規登録からは付与されません。
        </p>

      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  minLength,
  maxLength,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </label>
  );
}