import { useEffect, useState } from "react";
import { SLIDE_MS } from "../config";

// Every image in src/photos is picked up automatically
const photos = Object.values(
    import.meta.glob<string>('../photos/*.{jpg,jpeg,png,webp,gif}', { eager: true, query: '?url', import: 'default' })
);
const placeholders = ['🎂', '🎈', '🎉', '🎁']; // shown until you add photos

const rand = (n: number) => Math.floor(Math.random() * n);

function Slideshow() {
    const items = photos.length ? photos : placeholders;
    const [cur, setCur] = useState(() => rand(items.length));

    useEffect(() => {
        const t = setInterval(() => {
            setCur((c) => {
                let n: number;
                do n = rand(items.length); while (items.length > 1 && n === c);
                return n;
            });
        }, SLIDE_MS);
        return () => clearInterval(t);
    }, [items.length]);

    return (
        <div className="relative aspect-square w-[min(78vw,400px)] overflow-hidden border-2 border-[#481803] bg-[#3D1A0A]">
            {items.map((item, i) => (
                <div
                    key={i}
                    className={`absolute inset-0 transition-all duration-700 ${i === cur ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-105 -rotate-2"}`}
                >
                    {photos.length
                        ? <img src={item} alt="" className="size-full object-cover" />
                        : <span className="grid size-full place-items-center text-8xl">{item}</span>}
                </div>
            ))}
        </div>
    );
}

export default Slideshow;
