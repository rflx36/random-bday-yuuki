import { getStrokeStyleLg, getStrokeStyleMd, getStrokeStyleSm, getStrokeStyleXl, type strokeOpacityType } from "./strokes";

interface TextGAGProps {
    text: string,
    className?: string,
    strokeSize?: 'sm' | 'md' | 'lg' | 'xl';
    strokeOpacity?: strokeOpacityType;
}

// White text on top, an identical stroked copy underneath = outline that never eats the fill
function TextGAG({ text, className, strokeSize = 'md', strokeOpacity = 100 }: TextGAGProps) {
    const strokeSizeClasses = {
        sm: getStrokeStyleSm(strokeOpacity),
        md: getStrokeStyleMd(strokeOpacity),
        lg: getStrokeStyleLg(strokeOpacity),
        xl: getStrokeStyleXl(strokeOpacity)
    }

    return (
        <div className="font-comic relative w-full">
            <p className={`text-2xl text-white relative z-20 ${className}`}>{text}</p>
            <p className={`text-2xl absolute w-full text-black top-0 z-10 ${strokeSizeClasses[strokeSize]} ${className}`}>{text}</p>
        </div>
    )
}

export default TextGAG;
