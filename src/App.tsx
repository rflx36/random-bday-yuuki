import { useEffect, useState } from "react";
import ContainerGAG from "./components/container";
import TextGAG from "./components/text";
import Slideshow from "./components/slideshow";
import VideoStage from "./components/videostage";
import { partyConfetti } from "./utils/confetti";
import { MESSAGE, MUSIC, NAME } from "./config";
import GiftBox from "./components/gift";
import ChatWidget from "./components/chatwidget";
import ElusiveButton from "./components/elusivebutton";
import PixelBackground from "./components/pixelbg";
import BouncingBirthday from "./components/bouncingbirthday";

type Stage = "gift" | "video" | "show";

function App() {
    const [stage, setStage] = useState<Stage>("gift");
    const [playing, setPlaying] = useState(true);
    const [music] = useState(() => {
        const a = new Audio(MUSIC);
        a.loop = true;
        a.volume = 0.6;
        return a;
    });

    const openGift = () => {
        // Unlock audio inside the click so music can start later (Safari/iOS)
        music.play().then(() => music.pause()).catch(() => { });
        setStage("video");
    };

    useEffect(() => {
        if (stage !== "show") return;
        partyConfetti();
        music.currentTime = 0;
        music.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }, [stage, music]);

    const toggleMusic = () => {
        if (music.paused) { music.play(); setPlaying(true); }
        else { music.pause(); setPlaying(false); }
    };


    const dimMusic = () => {
        music.volume = 0.05;
    };

    const undimMusic = () => {
        music.volume = 0.6;
    }

    return (
        <main className="font-comic min-h-dvh flex flex-col items-center justify-center gap-4 p-4">
            <PixelBackground />
            {stage === "gift" && (
                <>
                    <p className="translate-y-50">Open le gift</p>
                    <ElusiveButton openGift={openGift}  >
                        <GiftBox isDocked={false} />
                    </ElusiveButton>

                </>
            )}

            {stage === "video" && <VideoStage onDone={() => setStage("show")} />}

            {stage === "show" && (
                <>
                    {/* <ContainerGAG variants="external" className="flex flex-col items-center gap-4">
                        <ContainerGAG variants="internal" className="flex flex-col items-center w-full">
                            <TextGAG text="HAPPY BIRTHDAY" className="text-4xl sm:text-5xl text-center" strokeSize="lg" strokeOpacity={50} />
                            <TextGAG text={`${NAME.toUpperCase()}!`} className="text-4xl sm:text-5xl text-center" strokeSize="lg" strokeOpacity={50} />
                        </ContainerGAG>
                        <ContainerGAG variants="internal" padding="p-2">
                            <Slideshow />
                        </ContainerGAG>
                        <ContainerGAG variants="internal" className="w-full">
                            <TextGAG text={MESSAGE} className="text-xl text-center" strokeSize="md" strokeOpacity={50} />
                        </ContainerGAG>
                    </ContainerGAG> */}
                    <BouncingBirthday images={["/monke.jpg", "/yuuki.png", "/emoji.png", "/dvd-logo-png-transparent.png"]} />
                    {/* <img src="/monke.jpg" alt="monke" className="absolute bottom-0 right-0 w-32 sm:w-48 md:w-64 lg:w-80 xl:w-96 2xl:w-[30rem] pointer-events-none select-none" /> */}
                    <ChatWidget isOpen={(isOpen) => { isOpen ? dimMusic() : undimMusic(); }} />

                </>
            )}
        </main>
    );
}

export default App;
