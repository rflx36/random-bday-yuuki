import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

// Put these in /public (Vite serves them from the site root).
const BLIP_SRC = "/sans.mp3";

type UserKey = "rflx" | "yuuki" | "keiiii";

interface Profile {
    name: string; // @username
    display: string; // shown name
    avatar: string; // webp in /public
    player?: boolean; // the user's own character (name is highlighted)
    rate: number; // playback speed of the blip (higher = squeakier voice)
}

const PROFILES: Record<UserKey, Profile> = {
    rflx: { name: "rflx36", display: "RFLX36", avatar: "/ava_rflx36.webp", rate: 1 },
    yuuki: { name: "luxi_via", display: "yuuki", avatar: "/ava_yuuki.webp", rate: 1.6, player: true },
    keiiii: { name: "keiiii_260", display: "keiiii_260", avatar: "/ava_keiiii_260.webp", rate: 1.25 },
};

interface Msg {
    id: number;
    from: UserKey;
    text: string;
}

const FONT = "font-['Press_Start_2P',monospace]";

/* ------------------------------------------------------------------ */
/* Voice blips: decoded once, played per letter via WebAudio           */
/* ------------------------------------------------------------------ */

const BLIP_MAX_SECONDS = 0.15; // cut long files so letters don't smear together

let audioCtx: AudioContext | null = null;
let blipBuffer: AudioBuffer | null = null;
let blipLoading: Promise<void> | null = null;
let activeBlip: AudioBufferSourceNode | null = null;

function getCtx() {
    return (audioCtx ??= new AudioContext());
}

/** Call from a click handler: unlocks audio and preloads the sound file. */
function unlockAudio() {
    try {
        const ctx = getCtx();
        if (ctx.state === "suspended") void ctx.resume();
        blipLoading ??= fetch(BLIP_SRC)
            .then((r) => {
                if (!r.ok) throw new Error(`Missing ${BLIP_SRC}`);
                return r.arrayBuffer();
            })
            .then((data) => ctx.decodeAudioData(data))
            .then((buf) => {
                blipBuffer = buf;
            })
            .catch((err) => {
                console.warn("[ChatWidget] blip file failed, using synth fallback:", err);
            });
    } catch {
        /* WebAudio unavailable */
    }
}

function playBlip(rate: number) {
    try {
        const ctx = getCtx();
        if (ctx.state === "suspended") void ctx.resume();
        const t = ctx.currentTime;
        const gain = ctx.createGain();
        gain.gain.value = 0.5;
        gain.connect(ctx.destination);
        const jitter = 0.94 + Math.random() * 0.12;

        if (blipBuffer) {
            // cut the previous blip so every letter is a clean, separate hit
            try {
                activeBlip?.stop();
            } catch {
                /* already stopped */
            }
            const src = ctx.createBufferSource();
            src.buffer = blipBuffer;
            src.playbackRate.value = rate * jitter;
            src.connect(gain);
            src.start(t);
            src.stop(t + BLIP_MAX_SECONDS);
            activeBlip = src;
        } else {
            // fallback: square-wave blip if the file is missing/not loaded yet
            const osc = ctx.createOscillator();
            osc.type = "square";
            osc.frequency.value = 175 * (rate - 2) * jitter;
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
            osc.connect(gain);
            osc.start(t);
            osc.stop(t + 0.08);
        }
    } catch {
        /* ignore */
    }
}

/* ------------------------------------------------------------------ */
/* Typewriter                                                          */
/* ------------------------------------------------------------------ */

interface TypewriterProps {
    text: string;
    rate: number;
    onTick: () => void;
    onDone: () => void;
}

function Typewriter({ text, rate, onTick, onDone }: TypewriterProps) {
    const [n, setN] = useState(0);
    const cbs = useRef({ onTick, onDone });
    cbs.current = { onTick, onDone };

    useEffect(() => {
        let i = 0;
        let timer: ReturnType<typeof setTimeout>;
        setN(0);

        const step = () => {
            i++;
            setN(i);
            const ch = text[i - 1];
            if (ch !== " ") playBlip(rate + 2);
            cbs.current.onTick();

            if (i >= text.length) {
                cbs.current.onDone();
                return;
            }
            const pause = /[.,?!]/.test(ch) ? 260 : 45;
            timer = setTimeout(step, pause);
        };

        timer = setTimeout(step, 45);
        return () => clearTimeout(timer);
    }, [text, rate]);

    return <>{text.slice(0, n)}</>;
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Avatar({ p }: { p: Profile }) {
    return (
        <img
            src={p.avatar}
            alt={p.display}
            className="h-10 w-10 shrink-0 border-2 border-white bg-zinc-800 object-cover [image-rendering:pixelated]"
        />
    );
}

function Row({ p, children }: { p: Profile; children: React.ReactNode }) {
    return (
        <div className="flex gap-3">
            <Avatar p={p} />
            <div className="min-w-0 flex-1">
                <p
                    className={`mb-1 text-[8px] leading-none ${p.player ? "text-cyan-300" : "text-yellow-300"}`}
                >
                    {p.display} <span className="text-zinc-500">@{p.name}</span>
                    {p.player && <span className="ml-1 text-cyan-300">(you)</span>}
                </p>
                <p className="break-words text-[10px] leading-relaxed">* {children}</p>
            </div>
        </div>
    );
}

/** Pixel speech bubble with a single "1" in the middle. */
function BubbleIcon() {
    return (
        <svg viewBox="0 0 16 16" shapeRendering="crispEdges" className="h-full w-full">
            <rect x="0" y="1" width="16" height="12" fill="#000" />
            <rect x="1" y="2" width="14" height="10" fill="#fff" />
            <rect x="3" y="13" width="4" height="1" fill="#000" />
            <rect x="3" y="14" width="3" height="1" fill="#000" />
            <rect x="3" y="15" width="2" height="1" fill="#000" />
            <rect x="4" y="13" width="2" height="1" fill="#fff" />
            {/* the "1" */}
            <g fill="#000">
                <rect x="7" y="4" width="1" height="1" />
                <rect x="6" y="5" width="2" height="1" />
                <rect x="7" y="6" width="1" height="1" />
                <rect x="7" y="7" width="1" height="1" />
                <rect x="6" y="8" width="3" height="1" />
            </g>
        </svg>
    );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

type Draft = Omit<Msg, "id"> & { delay?: number }; // delay (ms) before it starts typing

// What the player can say at each stage, and how the chat responds.
const STAGES: { options: string[]; reply: (opt: string) => Draft[] }[] = [
    {
        options: ["20", "30"],
        reply: (age) => [
            { from: "yuuki", text: age },
            { from: "rflx", text: age === "20" ? "Ah.. 200 sige sige" : "Ah 60?? ok ok" },
            { from: "keiiii", text: "mali mo" },
        ],
    },
    {
        options: ["Bakit late to?"],
        reply: (opt) => [
            { from: "yuuki", text: opt },
            { from: "rflx", text: "kasi ano..." },
        ],
    },
    {
        options: ["Ano?"],
        reply: (opt) => [
            { from: "yuuki", text: opt },
            { from: "rflx", text: "omsim ano oo ayun.." },
            { from: "keiiii", text: "Happy birthday!", delay: 1000 },
            { from: "rflx", text: "Happy birthday!", delay: 500 },
            { from: "rflx", text: "..belated hehe.." }
        ],
    },
];

export default function ChatWidget(props: { isOpen?: (x: boolean) => void }) {
    const profiles = PROFILES;

    const [open, setOpen] = useState(false);
    const [msgs, setMsgs] = useState<Msg[]>([]);
    const [queue, setQueue] = useState<Draft[]>([{ from: "rflx", text: "Ilang taon kana?" }]);
    const [typing, setTyping] = useState<Msg | null>(null);
    const [stage, setStage] = useState(0);

    const idRef = useRef(0);
    const bottomRef = useRef<HTMLDivElement>(null);
    const scroll = () => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    };

    // Pull the next queued message into the "typing" slot.
    useEffect(() => {
        if (!open || typing || queue.length === 0) return;
        const t = setTimeout(() => {
            setTyping({ id: ++idRef.current, ...queue[0] });
            setQueue((q) => q.slice(1));
        }, queue[0].delay ?? 450);
        return () => clearTimeout(t);
    }, [open, typing, queue]);

    useEffect(() => {
        scroll();
    }, [msgs, typing, stage, open]);

    const finishTyping = useCallback(() => {
        setTyping((cur) => {
            if (cur) setMsgs((m) => [...m, cur]);
            return null;
        });
    }, []);

    const choose = (opt: string) => {
        setQueue(STAGES[stage].reply(opt));
        setStage((n) => n + 1);
    };

    const options = STAGES[stage]?.options;
    const showChoices = open && !!options && !typing && queue.length === 0 && msgs.length > 0;
    const waiting = open && !typing && queue.length > 0;

    return (
        <div className={`fixed bottom-4 right-4 z-50 ${FONT}`}>
            {/* Chat panel */}
            {open && (
                <div
                    role="dialog"
                    aria-label="Chat"
                    className="mb-3 flex h-[26rem] w-[min(22rem,calc(100vw-2rem))] flex-col border-4 border-white bg-black text-white"
                >
                    <div className="flex items-center justify-between border-b-4 border-white px-3 py-2 text-[10px]">
                        <span>* CHAT</span>
                        <button
                            onClick={() => { setOpen(false); props.isOpen?.(false); }}
                            aria-label="Close chat"
                            className="px-1 hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yellow-300"
                        >
                            X
                        </button>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto p-3 [scrollbar-color:#fff_#000] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar-track]:bg-black">
                        {msgs.map((m) => (
                            <Row key={m.id} p={profiles[m.from]}>
                                {m.text}
                            </Row>
                        ))}

                        {typing && (
                            <Row p={profiles[typing.from]}>
                                <Typewriter
                                    key={typing.id}
                                    text={typing.text}
                                    rate={profiles[typing.from].rate}
                                    onTick={scroll}
                                    onDone={finishTyping}
                                />
                                <span className="ml-0.5 inline-block animate-pulse">_</span>
                            </Row>
                        )}

                        {waiting && <p className="animate-pulse text-[10px] text-zinc-500">* . . .</p>}
                        <div ref={bottomRef} />
                    </div>

                    {showChoices && (
                        <div className="flex border-t-4 border-white text-xs">
                            {options?.map((opt) => (
                                <button
                                    key={opt}
                                    onClick={() => choose(opt)}
                                    className="group flex flex-1 items-center justify-center gap-2 px-2 py-4 hover:text-yellow-300 focus-visible:text-yellow-300 focus-visible:outline-none"
                                >
                                    <span className="text-red-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                                        ♥
                                    </span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Launcher */}
            <button
                onClick={() => {
                    unlockAudio();
                    setOpen((o) => !o);
                    props.isOpen?.(!open);
                }}
                aria-label={open ? "Close chat" : "Open chat, 1 new message"}
                className="ml-auto block h-16 w-16 transition-transform hover:-translate-y-1 active:translate-y-0 focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-300 motion-reduce:transition-none"
            >
                <BubbleIcon />
            </button>
        </div>
    );
}