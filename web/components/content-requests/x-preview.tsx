const X_CHAR_LIMIT = 280;

export function XPreview({ body }: { body: string }) {
  const length = body.length;
  const overLimit = length > X_CHAR_LIMIT;

  return (
    <div className="mx-auto max-w-135 space-y-2">
      <div className="rounded-2xl border border-[#2f3336] bg-black p-4 text-white">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
            X
          </div>
          <div>
            <p className="text-sm font-semibold">Your Company</p>
            <p className="text-xs text-[#71767b]">@yourcompany</p>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-normal">{body}</p>
      </div>
      <p className={`text-right text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}>
        {length} / {X_CHAR_LIMIT}
      </p>
    </div>
  );
}
