import { Link } from "wouter";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { SITE_NAME } from "@/lib/site";

export default function DisclaimerPage() {
  return (
    <LegalPage eyebrow="DISCLAIMER" title="免責事項">
      <LegalSection title="非公式サイトであること">
        <p>
          {SITE_NAME}は、ゲームの運営元とは関係のない非公式のファンサイトです。
          詳しくは<Link href="/about" className="font-bold text-primary underline">サイトについて</Link>をご覧ください。
        </p>
      </LegalSection>

      <LegalSection title="掲載内容の正確性">
        <p>
          掲載している評価・性能・報酬などの情報は、できる限り正確になるよう努めていますが、その正確性・完全性・最新性を保証するものではありません。
          ゲームのアップデートや仕様変更により、実際の内容と異なる場合があります。
          評価は運営者の見解を含み、ゲーム内での結果を保証するものではありません。
        </p>
      </LegalSection>

      <LegalSection title="損害について">
        <p>本サイトの情報を利用したことによって生じた損害について、運営者は責任を負いません。ご利用は利用者ご自身の判断でお願いします。</p>
      </LegalSection>

      <LegalSection title="外部サイトへのリンク">
        <p>本サイトから外部サイトへリンクする場合があります。リンク先の内容や安全性について、運営者は責任を負いません。</p>
      </LegalSection>

      <LegalSection title="著作権・権利者の方へ">
        <p>
          ゲーム内の名称・画像などの権利は、各権利者に帰属します。
          掲載内容に関するご連絡は<Link href="/contact" className="font-bold text-primary underline">お問い合わせ</Link>をご覧ください。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
