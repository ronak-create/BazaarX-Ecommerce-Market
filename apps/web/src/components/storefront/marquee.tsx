import { Tag, Truck, ArrowsCounterClockwise, Lightning, Sparkle } from "@phosphor-icons/react/dist/ssr";

// The `Icon` type isn't exported from /dist/ssr in this version; derive it.
type IconCmp = typeof Tag;
type Item = { icon: IconCmp; text: string };

const OFFERS: Item[] = [
  { icon: Tag, text: "30% OFF your first order — code FIRST30" },
  { icon: Truck, text: "Free delivery over ₹499" },
  { icon: ArrowsCounterClockwise, text: "Easy 7-day returns" },
  { icon: Lightning, text: "New drops added every day" },
  { icon: Sparkle, text: "Cash on delivery across India" },
];

/**
 * Infinite offer ticker. Two identical copies of the row sit side by side and
 * the track animates by -50%, so the loop is seamless. Pure CSS, pauses on
 * hover. Emerald promo bar — the one chromatic accent in the monochrome system.
 */
export function Marquee() {
  return (
    <div className="group relative flex overflow-hidden bg-promo text-promo-fg">
      <div className="flex min-w-full shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {OFFERS.map(({ icon: Icon, text }, i) => (
              <li
                key={i}
                className="flex items-center gap-2 whitespace-nowrap px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
              >
                <Icon size={14} weight="fill" />
                <span>{text}</span>
                <span className="ml-4 opacity-50" aria-hidden>
                  ✦
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
