import ReactMarkdown from "react-markdown";

function wordCount(text: string) {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

export function NewsletterPreview({
  subject,
  body,
}: {
  subject: string | null;
  body: string;
}) {
  const words = wordCount(body);

  return (
    <div className="mx-auto max-w-135 space-y-2">
      <div className="rounded-lg border border-border bg-white text-black shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs text-[#00000099]">Subject</p>
          <p className="text-sm font-semibold">{subject || "(no subject)"}</p>
        </div>
        <div className="space-y-3 px-4 py-4 font-serif text-[15px] leading-relaxed [&_p]:my-0 [&_strong]:font-semibold">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      </div>
      <p className="text-right text-xs text-muted-foreground">{words} words</p>
    </div>
  );
}
