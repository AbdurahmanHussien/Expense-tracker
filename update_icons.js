const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceImg = "C:\\Users\\ThinkPad\\.gemini\\antigravity\\brain\\2e7e5e3e-737b-4552-9502-870bca5303e8\\expense_app_icon_no_borders_1771930551816.png";
const resDir = "d:\\Expense-tracker\\android\\app\\src\\main\\res";

const sizes = {
    "mipmap-mdpi": { launcher: 48, foreground: 108 },
    "mipmap-hdpi": { launcher: 72, foreground: 162 },
    "mipmap-xhdpi": { launcher: 96, foreground: 216 },
    "mipmap-xxhdpi": { launcher: 144, foreground: 324 },
    "mipmap-xxxhdpi": { launcher: 192, foreground: 432 }
};

async function generate() {
    try {
        for (const [folder, dims] of Object.entries(sizes)) {
            const folderPath = path.join(resDir, folder);
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

            const launcherSize = dims.launcher;
            await sharp(sourceImg)
                .resize(launcherSize, launcherSize)
                .webp()
                .toFile(path.join(folderPath, "ic_launcher.webp"));

            const circleSvg = `<svg width="${launcherSize}" height="${launcherSize}"><circle cx="${launcherSize / 2}" cy="${launcherSize / 2}" r="${launcherSize / 2}" fill="white"/></svg>`;
            await sharp(sourceImg)
                .resize(launcherSize, launcherSize)
                .composite([{ input: Buffer.from(circleSvg), blend: 'dest-in' }])
                .webp()
                .toFile(path.join(folderPath, "ic_launcher_round.webp"));

            const fgSize = dims.foreground;
            const safeSize = Math.floor(fgSize * 0.66);

            const safeImgBuffer = await sharp(sourceImg)
                .resize(safeSize, safeSize)
                .toBuffer();

            await sharp({
                create: {
                    width: fgSize,
                    height: fgSize,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                }
            })
                .composite([{ input: safeImgBuffer }])
                .webp()
                .toFile(path.join(folderPath, "ic_launcher_foreground.webp"));

            console.log(`Saved icons in ${folder}`);
        }
        console.log("SUCCESS");
    } catch (e) {
        console.error("Error:", e);
    }
}
generate();
