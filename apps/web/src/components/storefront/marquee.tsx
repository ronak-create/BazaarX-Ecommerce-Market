import { Lightning, Truck, Tag, ArrowsCounterClockwise } from "@phosphor-icons/react/dist/ssr";

// The `Icon` type isn't exported from /dist/ssr in this version; derive it.
type IconCmp = typeof Tag;
type Item = { icon: IconCmp; text: string };

const OFFERS: Item[] = [
  { icon: Tag, text: "FLAT 10% OFF on your first order — code BAZAAR10" },
  { icon: Truck, text: "Free delivery on orders over ₹499" },
  { icon: ArrowsCounterClockwise, text: "Easy 7-day returns, no questions asked" },
  { icon: Lightning, text: "New drops added every day" },
  { icon: Tag, text: "Cash on delivery available across India" },
];

/**
 * Infinite offer ticker. Two identical copies of the row sit side by side and
 * the track animates -50%, so the loop is seamless. Pure CSS (no JS), pauses on
 * hover. Black bar / white text to anchor the monochrome theme.
 */
export function Marquee() {
  return (
    <div className="group relative overflow-hidden border-b border-ink-900 bg-ink-900 text-ink-50">
      <div className="flex w-max animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {OFFERS.map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-2.5 px-7 py-2 text-xs font-medium tracking-wide">
                <Icon size={14} weight="fill" />
                <span className="uppercase">{text}</span>
                <span className="ml-5 text-ink-500" aria-hidden>
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
