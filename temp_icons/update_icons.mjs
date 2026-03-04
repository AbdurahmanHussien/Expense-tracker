import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImg = "C:\\Users\\ThinkPad\\.gemini\\antigravity\\brain\\2e7e5e3e-737b-4552-9502-870bca5303e8\\expense_app_icon_1771927062207.png";
const resDir = path.resolve("D:\\Expense-tracker\\android\\app\\src\\main\\res");

const sizes = {
    "mipmap-mdpi": { launcher: 48, foreground: 108 },
    "mipmap-hdpi": { launcher: 72, foreground: 162 },
    "mipmap-xhdpi": { launcher: 96, foreground: 216 },
    "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
    "mipmap-xxxhdpi": { launcher: 192, foreground: 432 },
};

async function processIcons() {
    for (const [folder, dims] of Object.entries(sizes)) {
        const folderPath = path.join(resDir, folder);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        // launcher icons
        await sharp(sourceImg)
            .resize(dims.launcher, dims.launcher)
            .webp()
            .toFile(path.join(folderPath, "ic_launcher.webp"));

        // round icon (composite with circle SVG mask)
        const circleSvg = `<svg width="${dims.launcher}" height="${dims.launcher}"><circle cx="${dims.launcher / 2}" cy="${dims.launcher / 2}" r="${dims.launcher / 2}" fill="white"/></svg>`;
        const roundBuffer = await sharp(sourceImg)
            .resize(dims.launcher, dims.launcher)
            .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
            .webp()
            .toBuffer();

        fs.writeFileSync(path.join(folderPath, "ic_launcher_round.webp"), roundBuffer);

        // foreground adaptive icon
        const safeSize = Math.floor(dims.foreground * 0.66);
        const safeBuffer = await sharp(sourceImg)
            .resize(safeSize, safeSize)
            .png()
            .toBuffer();

        await sharp({
            create: {
                width: dims.foreground,
                height: dims.foreground,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([{ input: safeBuffer, gravity: 'center' }])
            .webp()
            .toFile(path.join(folderPath, "ic_launcher_foreground.webp"));

        console.log(`Saved icons in ${folder}`);
    }
}

processIcons().catch(console.error);
