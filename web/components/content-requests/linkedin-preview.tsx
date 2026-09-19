export function LinkedinPreview({ body }: { body: string }) {
  return (
    <div className="mx-auto max-w-[540px] rounded-lg border border-[#e0e0e0] bg-white p-4 text-[#000000e6] shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#0a66c2] text-base font-bold text-white">
          in
        </div>
        <div>
          <p className="text-sm font-semibold">Your Company</p>
          <p className="text-xs text-[#00000099]">1,234 followers</p>
          <p className="text-xs text-[#00000099]">Now · 🌐</p>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-normal">{body}</p>
      <div className="mt-3 flex items-center justify-between border-t border-[#e0e0e0] pt-2 text-xs text-[#00000099]">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗ Share</span>
      </div>
    </div>
  );
}
