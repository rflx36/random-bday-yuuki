export type strokeOpacityType = 10 | 50 | 100;

// Full class strings are written out so Tailwind can detect them
export function getStrokeStyleSm(opacity: strokeOpacityType) {
    switch (opacity) {
        case 10: return "[text-stroke:1px_rgba(0,0,0,0.1)] [-webkit-text-stroke:1px_rgba(0,0,0,0.1)]";
        case 50: return "[text-stroke:1px_rgba(0,0,0,0.5)] [-webkit-text-stroke:1px_rgba(0,0,0,0.5)]";
        case 100: return "[text-stroke:1px_rgba(0,0,0,1)] [-webkit-text-stroke:1px_rgba(0,0,0,1)]";
    }
}

export function getStrokeStyleMd(opacity: strokeOpacityType) {
    switch (opacity) {
        case 10: return "[text-stroke:2px_rgba(0,0,0,0.1)] [-webkit-text-stroke:2px_rgba(0,0,0,0.1)]";
        case 50: return "[text-stroke:2px_rgba(0,0,0,0.5)] [-webkit-text-stroke:2px_rgba(0,0,0,0.5)]";
        case 100: return "[text-stroke:2px_rgba(0,0,0,1)] [-webkit-text-stroke:2px_rgba(0,0,0,1)]";
    }
}

export function getStrokeStyleLg(opacity: strokeOpacityType) {
    switch (opacity) {
        case 10: return "[text-stroke:4px_rgba(0,0,0,0.1)] [-webkit-text-stroke:4px_rgba(0,0,0,0.1)]";
        case 50: return "[text-stroke:4px_rgba(0,0,0,0.5)] [-webkit-text-stroke:4px_rgba(0,0,0,0.5)]";
        case 100: return "[text-stroke:4px_rgba(0,0,0,1)] [-webkit-text-stroke:4px_rgba(0,0,0,1)]";
    }
}

export function getStrokeStyleXl(opacity: strokeOpacityType) {
    switch (opacity) {
        case 10: return "[text-stroke:5px_rgba(0,0,0,0.1)] [-webkit-text-stroke:5px_rgba(0,0,0,0.1)]";
        case 50: return "[text-stroke:5px_rgba(0,0,0,0.5)] [-webkit-text-stroke:5px_rgba(0,0,0,0.5)]";
        case 100: return "[text-stroke:5px_rgba(0,0,0,1)] [-webkit-text-stroke:5px_rgba(0,0,0,1)]";
    }
}
