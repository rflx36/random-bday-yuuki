import confetti from 'canvas-confetti'

const colors = ['#54AC3A', '#7B3E23', '#FFD54A', '#FF6B6B', '#4DB8FF', '#FFFFFF']

export function partyConfetti() {
    confetti({ particleCount: 160, spread: 110, origin: { y: 0.6 }, colors })
    const end = Date.now() + 3500
    ;(function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors })
        confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
    })()
}
