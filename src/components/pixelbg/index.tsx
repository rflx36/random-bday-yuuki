import { useEffect, useRef, type ReactNode } from "react";

// 4x4 Bayer matrix, normalized to 0..1 (ordered dithering gives the crunchy pixel look)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);

const hash = (x: number, y: number): number => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const smooth = (t: number): number => t * t * (3 - 2 * t);

function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

function fbm(x: number, y: number): number {
  return noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.1;
}

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
};

/**
 * Mostly-white pixelated shader background with sparse dark gray dithered
 * drifts, in the spirit of Undertale / Deltarune backdrops.
 *
 * Props:
 *  - cell:   size of one "pixel" in CSS px (default 8)
 *  - speed:  drift speed multiplier (default 1)
 *  - bg:     base color
 *  - light:  soft gray tone
 *  - dark:   dark gray tone (used only at the densest peaks)
 *  - density: 0..1, how much gray shows up (default 0.35 = sparse)
 */
export interface PixelBackgroundProps {
  cell?: number;
  speed?: number;
  bg?: string;
  light?: string;
  dark?: string;
  density?: number;
  className?: string;
  children?: ReactNode;
}

export default function PixelBackground({
  cell = 8,
  speed = 1,
  bg = "#fafafa",
  light = "#e2e2e2",
  dark = "#b4b4b4",
  density = 0.35,
  className = "",
  children,
}: PixelBackgroundProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cBg = hexToRgb(bg);
    const cLight = hexToRgb(light);
    const cDark = hexToRgb(dark);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cols = 0;
    let rows = 0;
    let img: ImageData = ctx.createImageData(1, 1);
    let raf = 0;

    const resize = () => {
      const { width, height } = wrap.getBoundingClientRect();
      cols = Math.max(1, Math.ceil(width / cell));
      rows = Math.max(1, Math.ceil(height / cell));
      canvas.width = cols;
      canvas.height = rows;
      img = ctx.createImageData(cols, rows);
    };

    // higher density -> lower threshold -> more gray pixels
    const base = 0.78 - density * 0.3;

    const draw = (time: number) => {
      const t = time * 0.00006 * speed;
      const data = img.data;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // diagonal drift + a slow wobble, like the scrolling Deltarune dark world
          const u = (x + y * 0.5) * 0.045 + t * 6;
          const v = (y - x * 0.35) * 0.045 - t * 4 + Math.sin(t * 8 + x * 0.03) * 0.4;
          const n = fbm(u, v);
          const dither = BAYER[(y & 3) * 4 + (x & 3)];
          const value = n + (dither - 0.5) * 0.22;

          let c: RGB = cBg;
          if (value > base + 0.1) c = cDark;
          else if (value > base) c = cLight;

          const i = (y * cols + x) * 4;
          data[i] = c[0];
          data[i + 1] = c[1];
          data[i + 2] = c[2];
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) draw(40000);
    else raf = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(40000);
    });
    ro.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [cell, speed, bg, light, dark, density]);

  return (
    <div
      ref={wrapRef}
      className={` h-full absolute -z-10 w-full overflow-hidden bg-neutral-50 ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* Usage:

import PixelBackground from "./PixelBackground";

export default function App() {
  return (
    <PixelBackground cell={8} density={0.35}>
      <main className="flex min-h-screen items-center justify-center">
        <h1 className="font-mono text-4xl text-neutral-800">* hello.</h1>
      </main>
    </PixelBackground>
  );
}
*/