import { LegalPage, LegalSection } from "@/components/legal-page";
import { OPERATOR_INFO } from "@/lib/site";

export default function ContactPage() {
  const hasContact = Boolean(OPERATOR_INFO.contactUrl || OPERATOR_INFO.contactEmail);

  return (
    <LegalPage eyebrow="CONTACT" title="お問い合わせ">
      <LegalSection title="お問い合わせ方法">
        {hasContact ? (
          <>
            {OPERATOR_INFO.contactUrl ? (
              <p>
                お問い合わせフォーム：
                <a href={OPERATOR_INFO.contactUrl} className="font-bold text-primary underline" target="_blank" rel="noopener noreferrer">
                  {OPERATOR_INFO.contactUrl}
                </a>
              </p>
            ) : null}
            {OPERATOR_INFO.contactEmail ? <p>メール：{OPERATOR_INFO.contactEmail}</p> : null}
          </>
        ) : (
          <p>お問い合わせ窓口は準備中です。公開までしばらくお待ちください。</p>
        )}
      </LegalSection>

      <LegalSection title="ご連絡いただきたい内容">
        <ul className="list-disc space-y-1 pl-5">
          <li>掲載情報の誤り・更新漏れのご指摘</li>
          <li>権利者の方からの、掲載内容に関するご連絡</li>
          <li>サイトの不具合のご報告</li>
        </ul>
        <p>内容によっては、返信までにお時間をいただく場合や、お返事できない場合があります。</p>
      </LegalSection>
    </LegalPage>
  );
}
