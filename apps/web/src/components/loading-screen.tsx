/**
 * Full-bleed route-transition loader. Rendered by every `loading.tsx` Suspense
 * boundary so navigation shows the Sandy animation instantly instead of the
 * page appearing to hang while the server component streams.
 */
export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] w-full place-items-center">
      <div className="flex flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sandy-loading.svg"
          alt=""
          width={120}
          height={120}
          className="h-28 w-28 select-none"
          draggable={false}
        />
        <div className="flex items-center gap-1.5 text-sm font-medium tracking-wide text-ink-500">
          <span>{label}</span>
          <span className="inline-flex gap-0.5">
            <span className="h-1 w-1 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.3s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.15s]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-ink-400" />
          </span>
        </div>
      </div>
    </div>
  );
}
