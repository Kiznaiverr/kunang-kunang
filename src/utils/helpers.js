export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function createProgressBar(current, total, length = 20) {
    const progress = Math.round((current / total) * length);
    const empty = length - progress;

    return `[${'='.repeat(progress)}${'-'.repeat(empty)}]`;
}
