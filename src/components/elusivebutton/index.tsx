import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

const FLEE_RADIUS = 140; // desktop: cursor distance (px) that makes the button run
const CHASE_LIMIT_MS = 5000; // desktop: total continuous chase time before it gives up
const CHASE_GAP_MS = 1200; // desktop: pause longer than this resets the chase
const TAP_LIMIT = 5; // mobile: taps before it gives up
const TAP_RADIUS: readonly [number, number] = [70, 160]; // mobile: min/max teleport distance
const MARGIN = 12; // keep this far from viewport edges
const WIGGLE_MS = 500; // length of one wiggle
const PRESS_DELAY_MS = 1000; // wiggle time between the final press and openGift
const POP_MS = 900; // how long the "taps left" number lives
const COUNTDOWN_LINGER_MS = 800; // how long "0s" stays up before hiding

const NUMBER_CLASS =
  "text-3xl text-white font-['Press_Start_2P',monospace] [-webkit-text-stroke:6px_black] [paint-order:stroke_fill]";

interface Point {
  x: number;
  y: number;
}

interface Pop {
  id: number;
  value: number;
  dx: number;
  dy: number;
}

export interface ElusiveButtonProps {
  openGift: () => void;
  children?: ReactNode;
  className?: string;
}

const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);
const rand = (min: number, max: number): number => min + Math.random() * (max - min);
const prefersReducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Number that pops out of the button, then fades away. */
function PopNumber({ pop, onDone }: { pop: Pop; onDone: (id: number) => void }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const at = (k: number, scale: number) =>
      `translate(calc(-50% + ${pop.dx * k}px), calc(-50% + ${pop.dy * k}px)) scale(${scale})`;

    const anim = ref.current?.animate(
      [
        { opacity: 0, transform: at(0, 0.3) },
        { opacity: 1, transform: at(0.75, 1.4), offset: 0.3 },
        { opacity: 0, transform: at(1, 1) },
      ],
      { duration: POP_MS, easing: "ease-out", fill: "forwards" },
    );
    if (anim) anim.onfinish = () => onDone(pop.id);
    return () => anim?.cancel();
  }, [pop, onDone]);

  return (
    <span
      ref={ref}
      style={{ opacity: 0 }}
      className={`pointer-events-none absolute left-1/2 top-1/2 ${NUMBER_CLASS}`}
    >
      {pop.value}
    </span>
  );
}

/** Seconds left while the cursor is chasing the button (desktop). */
function Countdown({ value, below }: { value: number; below: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  // little pulse every time the number changes
  useEffect(() => {
    if (prefersReducedMotion()) return;
    ref.current?.animate(
      [{ transform: "scale(1.6)" }, { transform: "scale(1)" }],
      { duration: 250, easing: "ease-out" },
    );
  }, [value]);

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 flex justify-center ${
        below ? "top-full mt-3" : "bottom-full mb-3"
      }`}
    >
      <span ref={ref} className={NUMBER_CLASS}>
        {value}s
      </span>
    </div>
  );
}

export default function ElusiveButton({
  openGift,
  children = "Open your gift",
  className = "",
}: ElusiveButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const posRef = useRef<Point>({ x: 0, y: 0 }); // top-left of the button
  const [pos, setPos] = useState<Point | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  const openRef = useRef(openGift);
  const unlocked = useRef(false); // true once it stops running and can be pressed
  const pressed = useRef(false); // true once the final press happened
  const taps = useRef(0);
  const popId = useRef(0);
  const wiggleAnim = useRef<Animation | null>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const pressTimer = useRef<number | undefined>(undefined);
  const chase = useRef({ ms: 0, last: 0 });
  const isDesktop = useRef(false);

  useEffect(() => {
    openRef.current = openGift;
  }, [openGift]);

  useEffect(() => () => window.clearTimeout(pressTimer.current), []);

  // hide the countdown after `ms` unless another chase event reschedules it
  const scheduleHide = useCallback((ms: number): void => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setCountdown(null), ms);
  }, []);

  const size = (): { w: number; h: number } => {
    const el = wrapRef.current;
    return { w: el?.offsetWidth ?? 0, h: el?.offsetHeight ?? 0 };
  };

  // Place the button by its center, clamped to the viewport.
  const moveCenter = useCallback((cx: number, cy: number): void => {
    const { w, h } = size();
    const x = clamp(cx - w / 2, MARGIN, window.innerWidth - w - MARGIN);
    const y = clamp(cy - h / 2, MARGIN, window.innerHeight - h - MARGIN);
    posRef.current = { x, y };
    setPos({ x, y });
  }, []);

  const wiggle = (iterations = 1): void => {
    if (prefersReducedMotion()) return;
    wiggleAnim.current?.cancel();
    wiggleAnim.current =
      btnRef.current?.animate(
        [
          { transform: "rotate(0deg) scale(1)" },
          { transform: "rotate(-14deg) scale(1.08)", offset: 0.15 },
          { transform: "rotate(12deg) scale(1.08)", offset: 0.35 },
          { transform: "rotate(-9deg) scale(1.04)", offset: 0.55 },
          { transform: "rotate(6deg) scale(1.02)", offset: 0.75 },
          { transform: "rotate(0deg) scale(1)" },
        ],
        { duration: WIGGLE_MS, iterations, easing: "ease-in-out" },
      ) ?? null;
  };

  // The real press: wiggle for 1s, then call openGift.
  const press = useCallback((): void => {
    if (pressed.current) return;
    pressed.current = true;
    wiggle(PRESS_DELAY_MS / WIGGLE_MS);
    pressTimer.current = window.setTimeout(() => openRef.current(), PRESS_DELAY_MS);
  }, []);

  const spawnPop = (value: number): void => {
    const { w, h } = size();
    const angle = rand(0, Math.PI * 2);
    const reach = Math.max(w, h) / 2 + rand(25, 60);
    setPops((p) => [
      ...p,
      {
        id: ++popId.current,
        value,
        dx: Math.cos(angle) * reach,
        dy: Math.sin(angle) * reach,
      },
    ]);
  };

  const removePop = useCallback((id: number): void => {
    setPops((p) => p.filter((x) => x.id !== id));
  }, []);

  // Start centered; keep inside the viewport on resize.
  useLayoutEffect(() => {
    moveCenter(window.innerWidth / 2, window.innerHeight / 2);
    const onResize = (): void => {
      const { w, h } = size();
      moveCenter(posRef.current.x + w / 2, posRef.current.y + h / 2);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [moveCenter]);

  // Desktop: dodge the cursor and track how long it's being chased.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    isDesktop.current = mq.matches;
    const onChange = (e: MediaQueryListEvent): void => {
      isDesktop.current = e.matches;
    };
    mq.addEventListener("change", onChange);

    const onMove = (e: MouseEvent): void => {
      if (!isDesktop.current || unlocked.current) return;
      const { w, h } = size();
      const { x, y } = posRef.current;
      const mx = e.clientX;
      const my = e.clientY;

      // distance from cursor to the button's edge
      const dx = Math.max(x - mx, 0, mx - (x + w));
      const dy = Math.max(y - my, 0, my - (y + h));
      const dist = Math.hypot(dx, dy);
      if (dist >= FLEE_RADIUS) return;

      // chase timer
      const now = performance.now();
      if (chase.current.last && now - chase.current.last < CHASE_GAP_MS) {
        chase.current.ms += now - chase.current.last;
      } else {
        chase.current.ms = 0;
      }
      chase.current.last = now;

      // countdown shown while chasing; hides itself if the chase stops
      const secondsLeft = Math.max(
        0,
        Math.ceil((CHASE_LIMIT_MS - chase.current.ms) / 1000),
      );
      setCountdown(secondsLeft);

      // timer hit 0: it stops running and can now be pressed
      if (chase.current.ms >= CHASE_LIMIT_MS) {
        unlocked.current = true;
        scheduleHide(COUNTDOWN_LINGER_MS);
        return;
      }
      scheduleHide(CHASE_GAP_MS);

      // run away from the cursor
      const cx = x + w / 2;
      const cy = y + h / 2;
      let vx = cx - mx;
      let vy = cy - my;
      let len = Math.hypot(vx, vy);
      if (len < 1) {
        const a = rand(0, Math.PI * 2);
        vx = Math.cos(a);
        vy = Math.sin(a);
        len = 1;
      }
      const step = FLEE_RADIUS - dist + 40;
      moveCenter(cx + (vx / len) * step, cy + (vy / len) * step);

      // cornered against an edge? hop to a spot far from the cursor instead
      const p = posRef.current;
      const ndx = Math.max(p.x - mx, 0, mx - (p.x + w));
      const ndy = Math.max(p.y - my, 0, my - (p.y + h));
      if (Math.hypot(ndx, ndy) < FLEE_RADIUS * 0.6) {
        let best: Point | null = null;
        let bestDist = -1;
        for (let i = 0; i < 12; i++) {
          const tx = rand(MARGIN, window.innerWidth - w - MARGIN);
          const ty = rand(MARGIN, window.innerHeight - h - MARGIN);
          const d = Math.hypot(tx + w / 2 - mx, ty + h / 2 - my);
          if (d > bestDist) {
            bestDist = d;
            best = { x: tx, y: ty };
          }
        }
        if (best) moveCenter(best.x + w / 2, best.y + h / 2);
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      mq.removeEventListener("change", onChange);
      window.clearTimeout(hideTimer.current);
    };
  }, [moveCenter, scheduleHide]);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>): void => {
    // Unlocked (desktop or mobile): this is the real press.
    if (unlocked.current) {
      e.preventDefault();
      press();
      return;
    }

    // Still running: mouse presses are ignored on desktop (it dodges anyway).
    if (isDesktop.current && e.pointerType === "mouse") return;
    e.preventDefault();

    // Mobile: wiggle + show taps left, teleport near the tap.
    taps.current += 1;
    wiggle();
    spawnPop(TAP_LIMIT - taps.current);

    // Out of taps: it stops here and the next tap is the real press.
    if (taps.current >= TAP_LIMIT) {
      unlocked.current = true;
      return;
    }
    const angle = rand(0, Math.PI * 2);
    const r = rand(TAP_RADIUS[0], TAP_RADIUS[1]);
    moveCenter(e.clientX + Math.cos(angle) * r, e.clientY + Math.sin(angle) * r);
  };

  // Keyboard activation (Enter / Space) only counts once it's unlocked.
  const onClick = (e: ReactMouseEvent<HTMLButtonElement>): void => {
    if (e.detail === 0 && unlocked.current) press();
  };

  return (
    <div
      ref={wrapRef}
      style={{
        transform: pos ? `translate3d(${pos.x}px, ${pos.y}px, 0)` : undefined,
      }}
      className={`fixed left-0 top-0 z-50 transition-transform duration-150 ease-out motion-reduce:transition-none ${
        pos ? "visible" : "invisible"
      }`}
    >
      <button
        ref={btnRef}
        type="button"
        onPointerDown={onPointerDown}
        onClick={onClick}
        className={`select-none touch-manipulation rounded-full  px-6 py-3 font-semibold  outline-none   ${className}`}
      >
        {children}
      </button>

      {countdown !== null && (
        <Countdown value={countdown} below={(pos?.y ?? 0) < 64} />
      )}

      {pops.map((pop) => (
        <PopNumber key={pop.id} pop={pop} onDone={removePop} />
      ))}
    </div>
  );
}