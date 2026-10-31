import { Link } from "wouter";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { OPERATOR_INFO, SITE_NAME } from "@/lib/site";

export default function AboutPage() {
  return (
    <LegalPage eyebrow="ABOUT" title="サイトについて">
      <LegalSection title={`${SITE_NAME}とは`}>
        <p>
          {SITE_NAME}は、ONE PIECE バウンティラッシュの情報を調べやすく整理することを目的とした、ファンによる攻略データベースです。
          次の情報を確認できます。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li><Link href="/characters" className="font-bold text-primary underline">キャラクター</Link>：評価・スキル・ステータス・タグ</li>
          <li><Link href="/medals" className="font-bold text-primary underline">メダル</Link>：固有特性・追加特性・メダルタグ</li>
          <li><Link href="/challenge-battles" className="font-bold text-primary underline">チャレンジバトル</Link>：開催期間と報酬</li>
          <li><Link href="/event-missions" className="font-bold text-primary underline">イベントミッション</Link>：ミッション内容と報酬</li>
        </ul>
      </LegalSection>

      <LegalSection title="非公式サイトです">
        <p>
          本サイトは、ゲームの運営元・配信元・権利者とは一切関係のない、個人（ファン）が運営する非公式のサイトです。
          公式から提供・承認・後援を受けたものではありません。
        </p>
        <p>
          ゲーム内の名称、キャラクター、画像などの権利は、それぞれの権利者に帰属します。
          権利者から掲載内容の変更や削除の要請があった場合は、速やかに対応します。
        </p>
      </LegalSection>

      <LegalSection title="掲載情報について">
        <p>
          掲載内容は運営者が確認できた範囲で登録・更新していますが、ゲームのアップデートなどにより実際の仕様と異なる場合があります。
          詳しくは<Link href="/disclaimer" className="font-bold text-primary underline">免責事項</Link>をご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="運営者情報">
        {OPERATOR_INFO.name ? <p>運営者：{OPERATOR_INFO.name}</p> : <p>運営者情報は準備中です。</p>}
        <p>
          ご意見・誤りのご指摘などは<Link href="/contact" className="font-bold text-primary underline">お問い合わせ</Link>をご覧ください。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
