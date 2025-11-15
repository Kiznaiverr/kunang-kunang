export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export function createProgressBar(current: number, total: number, length: number = 20): string {
    const progress = Math.round((current / total) * length);
    const empty = length - progress;

    return `[${'='.repeat(progress)}${'-'.repeat(empty)}]`;
}
