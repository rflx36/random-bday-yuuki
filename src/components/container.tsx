import type { ReactNode } from "react";

interface ContainerGAGProps {
    // external: textured brown frame · internal: green panel that sits on top of it
    variants?: "external" | "internal",
    padding?: "p-4" | "p-2" | "p-0",
    className?: string,
    children: ReactNode
}

function ContainerGAG({ variants = "external", padding = "p-4", className = "", children }: ContainerGAGProps) {
    const containerStyleVariants = {
        external: "bg-style bg-[#7B3E23]",
        internal: "bg-[#54AC3A]"
    }

    return (
        <div className={`${padding} box-border border-2 border-[#481803] max-w-full ${containerStyleVariants[variants]} ${className}`}>
            {children}
        </div>
    )
}

export default ContainerGAG;
