import { useEffect, useMemo, useRef } from "react";

type BouncingBirthdayProps = {
  /** Reference image URLs (imports, /public paths, or remote URLs). */
  images: string[];
  /** The full phrase. */
  title?: string;
  /** Separate words that also bounce on their own. */
  words?: string[];
  /** Image height as a fraction of viewport height. 0.1 = 1/10 (the minimum). */
  imageHeightRatio?: number;
  /** Text font size as a fraction of viewport height (title uses 1.3x). */
  textSizeRatio?: number;
  /** Min/max speed in px per second. */
  speedRange?: [number, number];
  /** Min/max text spin in degrees per second (random sign). */
  spinRange?: [number, number];
  className?: string;
};

type Item = {
  id: string;
  kind: "image" | "text";
  src?: string;
  text?: string;
  scale: number; // font size multiplier for text
};

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  w: number;
  h: number;
  ready: boolean;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randomColor = () => `hsl(${Math.floor(rand(0, 360))} 90% 65%)`;

export default function BouncingBirthday({
  images,
  title = "Happy birthday Shin..abon",
  words = ["happy", "birthday", "yuuki","luxi","dei","kyod","xion","(╯°□°）╯︵ ┻━┻ etc.. "],
  imageHeightRatio = 0.14,
  textSizeRatio = 0.07,
  speedRange = [120, 240],
  spinRange = [25, 70],
  className = "",
}: BouncingBirthdayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const elRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Never go below 1/10 of the screen height.
  const ratio = Math.max(0.1, imageHeightRatio);

  const items = useMemo<Item[]>(
    () => [
      ...images.map<Item>((src, i) => ({
        id: `img-${i}`,
        kind: "image",
        src,
        scale: 1,
      })),
      { id: "title", kind: "text", text: title, scale: 1.3 },
      ...words.map<Item>((text, i) => ({
        id: `word-${i}`,
        kind: "text",
        text,
        scale: 1,
      })),
    ],
    [images, title, words]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const bodies: Body[] = items.map((item) => {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(speedRange[0], speedRange[1]);
      return {
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: item.kind === "text" ? rand(0, 360) : 0,
        spin:
          item.kind === "text"
            ? rand(spinRange[0], spinRange[1]) * (Math.random() < 0.5 ? -1 : 1)
            : 0,
        w: 0,
        h: 0,
        ready: false,
      };
    });

    // Track unrotated element sizes (images load async, fonts change width).
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const idx = elRefs.current.indexOf(entry.target as HTMLDivElement);
        if (idx === -1) continue;
        const el = entry.target as HTMLDivElement;
        bodies[idx].w = el.offsetWidth;
        bodies[idx].h = el.offsetHeight;
      }
    });
    elRefs.current.forEach((el) => el && ro.observe(el));

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // Clamp dt so a background tab doesn't cause a huge jump.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      bodies.forEach((b, i) => {
        const el = elRefs.current[i];
        if (!el || b.w === 0 || b.h === 0) return;

        b.angle += b.spin * dt;

        // Bounding box of the rotated element, so edges hit the walls exactly.
        const rad = (b.angle * Math.PI) / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        const bw = b.w * cos + b.h * sin;
        const bh = b.w * sin + b.h * cos;

        // x, y track the element's CENTER.
        const minX = bw / 2;
        const maxX = cw - bw / 2;
        const minY = bh / 2;
        const maxY = ch - bh / 2;

        if (!b.ready) {
          b.x = rand(minX, Math.max(minX, maxX));
          b.y = rand(minY, Math.max(minY, maxY));
          b.ready = true;
          el.style.visibility = "visible";
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        let bounced = false;
        if (b.x < minX) {
          b.x = minX;
          b.vx = Math.abs(b.vx);
          bounced = true;
        } else if (b.x > maxX) {
          b.x = maxX;
          b.vx = -Math.abs(b.vx);
          bounced = true;
        }
        if (b.y < minY) {
          b.y = minY;
          b.vy = Math.abs(b.vy);
          bounced = true;
        } else if (b.y > maxY) {
          b.y = maxY;
          b.vy = -Math.abs(b.vy);
          bounced = true;
        }

        if (bounced && items[i].kind === "text") {
          el.style.color = randomColor();
        }

        el.style.transform = `translate3d(${b.x - b.w / 2}px, ${
          b.y - b.h / 2
        }px, 0) rotate(${b.angle}deg)`;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // Restart the simulation only when the item set or motion settings change.
  }, [items, speedRange, spinRange]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden ${className}`}
      aria-label={title}
    >
      {items.map((item, i) => (
        <div
          key={item.id}
          ref={(el) => {
            elRefs.current[i] = el;
          }}
          // Hidden until its size is known and a start position is picked.
          style={{ visibility: "hidden" }}
          className="pointer-events-none absolute left-0 top-0 will-change-transform"
        >
          {item.kind === "image" ? (
            <img
              src={item.src}
              alt=""
              draggable={false}
              // Height fixed to a share of the viewport; width follows the
              // intrinsic aspect ratio, so images are never distorted.
              style={{ height: `${ratio * 100}vh`, width: "auto" }}
              className="block max-w-none select-none"
            />
          ) : (
            <span
              style={{
                fontSize: `${textSizeRatio * item.scale * 100}vh`,
                color: randomColor(),
              }}
              className="block select-none whitespace-nowrap font-black leading-none tracking-tight"
            >
              {item.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   Usage (App.tsx)

   import BouncingBirthday from "./BouncingBirthday";
   import a from "./assets/yuuki-1.png";
   import b from "./assets/yuuki-2.png";

   export default function App() {
     return (
       <div className="h-screen w-screen bg-zinc-950">
         <BouncingBirthday images={[a, b]} />
       </div>
     );
   }
---------------------------------------------------------------- */