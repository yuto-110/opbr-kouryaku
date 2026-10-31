import { Link } from "wouter";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { SITE_NAME } from "@/lib/site";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="PRIVACY POLICY"
      title="プライバシーポリシー"
      description={`${SITE_NAME}での情報の取り扱いについて説明します。`}
    >
      <LegalSection title="ご利用にあたって">
        <p>
          閲覧するだけであれば、アカウント登録は必要ありません。
          アカウントを登録すると、所持キャラクターやお気に入り、保存した編成などを記録できます。
        </p>
      </LegalSection>

      <LegalSection title="アカウント登録時に保存する情報">
        <p>アカウントを登録した場合、次の情報をデータベースに保存します。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ユーザー名、メールアドレス</li>
          <li>パスワード（元のパスワードは保存せず、変換した値のみを保存します）</li>
          <li>ご自身が登録した、所持キャラクター（★・レベルなど）、お気に入りキャラクター、保存したサポート編成・メダル編成</li>
        </ul>
        <p>これらは、ログイン・ご本人向けの機能の提供のためにのみ利用し、法令に基づく場合を除き、第三者に提供しません。</p>
      </LegalSection>

      <LegalSection title="ブラウザに保存する情報">
        <p>
          本サイトは、ご利用の端末のブラウザ（ローカルストレージ）に、ログイン状態を保つための情報や、表示テーマ（ライト／ダーク）の設定を保存します。
          これらは端末内に保存されるもので、ブラウザのデータを削除すると消去されます。
        </p>
      </LegalSection>

      <LegalSection title="アクセス解析・広告について">
        <p>
          現時点で、本サイトはアクセス解析ツールや広告配信サービスを導入していません。
          将来これらを導入する場合は、利用するサービス、取得する情報、無効化の方法を、事前に本ページへ追記します。
        </p>
      </LegalSection>

      <LegalSection title="サーバーのログについて">
        <p>
          本サイトは外部のホスティングサービス上で運営しています。
          一般に、こうしたサービスでは、アクセスに関する技術的な記録（アクセス日時・IPアドレスなど）がサービス側に保存されることがあります。
        </p>
      </LegalSection>

      <LegalSection title="情報の削除・お問い合わせ">
        <p>
          登録情報の削除などのご希望は、<Link href="/contact" className="font-bold text-primary underline">お問い合わせ</Link>からご連絡ください。
        </p>
      </LegalSection>

      <LegalSection title="改定について">
        <p>必要に応じて本ポリシーを改定します。改定した場合は、このページの最終更新日を更新します。</p>
      </LegalSection>
    </LegalPage>
  );
}
