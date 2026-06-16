/**
 * Per-navigation wrapper (re-mounts on every route change, unlike layout), so
 * each storefront page eases in instead of snapping. Keeps transitions smooth.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-fade-in">{children}</div>;
}
