import { useCallback, useEffect, useRef } from "react";
import ContainerGAG from "./container";
import { VIDEO } from "../config";

function VideoStage({ onDone }: { onDone: () => void }) {
    const ref = useRef<HTMLVideoElement>(null);
    const done = useRef(false);
    const capSet = useRef(false);

    const finish = useCallback(() => {
        if (done.current) return;
        done.current = true;
        ref.current?.pause();
        onDone();
    }, [onDone]);

    // Missing/blocked video → skip straight to the party
    useEffect(() => { ref.current?.play().catch(finish); }, [finish]);

    return (
        <ContainerGAG variants="external" padding="p-2">
            <ContainerGAG variants="internal" padding="p-2">
                <video
                    ref={ref}
                    src={VIDEO}
                    playsInline
                    muted
                    preload="auto"
                    className="block max-h-[68dvh] max-w-[88vw] bg-black"
                    onEnded={finish}
                    onError={finish}
                    onPlaying={() => {            // hard 8s cap
                        if (capSet.current) return;
                        capSet.current = true;
                        setTimeout(finish, 8000);
                    }}
                />
            </ContainerGAG>
        </ContainerGAG>
    );
}

export default VideoStage;
