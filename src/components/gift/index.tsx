




export default function GiftBox(props: {
    isDocked: boolean
}) {



    return (
        <div className="animate-box-oscillate flex justify-center translate-y-4" style={{ animationDelay: Math.random() * 2 + "s" }}>
            <svg width="201" height="84" viewBox="0 0 201 84" className={`absolute animate-box-random-rotate ease-out duration-300 ${props.isDocked ? "-translate-y-50" : " -translate-y-10"}`} style={{ animationDelay: Math.random() * 2 + "s" }} fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M90 69.9999H100.5H112H115V38.9999V29.9999H87V36.9999V69.9999H90Z" fill="#FFC83D" />
                <path d="M0 34.9999V64.9999C0 67.7613 2.23858 69.9999 5 69.9999H13H87V36.9999L0.228901 33.4999C0.0801769 33.9734 0 34.4773 0 34.9999Z" fill="#7C9CFF" />
                <path d="M196 69.9999C198.761 69.9999 201 67.7613 201 64.9999V54.9999L115 38.9999V69.9999H188H196Z" fill="#7C9CFF" />
                <path d="M201 34.9999C201 32.2385 198.761 29.9999 196 29.9999H115V38.9999L201 54.9999V34.9999Z" fill="#9DB4FF" />
                <path d="M87 29.9999H5C2.76118 29.9999 0.866033 31.4713 0.228901 33.4999L87 36.9999V29.9999Z" fill="#9DB4FF" />
                <path d="M100.229 29.6577C83.2292 15.3244 50.7292 -8.74228 56.7292 9.65772C62.7292 28.0577 88.2292 30.6577 100.229 29.6577ZM100.229 29.6577C106.896 19.1577 122.129 0.157715 129.729 8.15771C139.229 18.1577 129.229 27.1577 100.229 29.6577ZM100.229 29.6577C88.3959 31.9911 75.5 47.9999 67 80.9999M100.229 29.6577C120.5 43.9999 119.5 45.9999 132 80.9999" stroke="#FFC83D" strokeWidth="6" strokeLinecap="round" />
            </svg>

            <svg width="175" height="141" className={`${props.isDocked ? "translate-y-50" : ""} ease-out duration-300`} viewBox="0 0 175 141" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M175 121V5H99V141H155C166.046 141 175 132.046 175 121Z" fill="#5B7CFA" />
                <path d="M77 141H99V5H88H77V141Z" fill="#FFC83D" />
                <path d="M87.5 0H77V5H88H99V0H87.5Z" fill="#E5A91A" />
                <path d="M175 0H102H99V5H175V0Z" fill="#7390FF" />
                <path fillRule="evenodd" clipRule="evenodd" d="M77 141V5H0V121C0 132.046 8.9543 141 20 141H77Z" fill="#5B7CFA" />
                <path d="M77 0H74H0V5H77V0Z" fill="#7390FF" />
            </svg>

        </div>
    )
}