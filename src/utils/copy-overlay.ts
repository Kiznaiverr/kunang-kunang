import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

/**
 * Copy overlay files from src to dist after build
 * Cross-platform utility for copying web overlay assets
 */

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

const SRC_DIR: string = path.join(__dirname, '..', '..', 'src', 'web', 'overlay');
const DEST_DIR: string = path.join(__dirname, '..', '..', 'dist', 'web', 'overlay');

interface Dirent {
    name: string;
    isDirectory(): boolean;
}

function copyFileSync(src: string, dest: string): void {
    const destDir: string = path.dirname(dest);

    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(src, dest);
}

function copyDirRecursive(src: string, dest: string): void {
    const entries: Dirent[] = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath: string = path.join(src, entry.name);
        const destPath: string = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

function copyOverlayFiles(): void {
    try {
        if (!fs.existsSync(SRC_DIR)) {
            console.error(`Source directory not found: ${SRC_DIR}`);
            process.exit(1);
        }

        if (!fs.existsSync(DEST_DIR)) {
            fs.mkdirSync(DEST_DIR, { recursive: true });
        }

        copyDirRecursive(SRC_DIR, DEST_DIR);

        console.log('Overlay files copied successfully');

    } catch (error) {
        const errorMessage: string = error instanceof Error ? error.message : String(error);
        console.error('Failed to copy overlay files:', errorMessage);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    copyOverlayFiles();
}

export { copyOverlayFiles };