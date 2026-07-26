/**
 * Generate ZitFlow brand + PWA assets from src/assets/brand/zitflow-logo-source.png
 * Run: npm run generate-brand
 *
 * Splash uses sharp (Windows-safe). Optional puppeteer path: ENABLE_PWA_ASSET_GEN=1
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { generateImages } = require('pwa-asset-generator');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/assets/brand/zitflow-logo-source.png');
const CANVAS = '#F7F6F2';
/** Cream / near-white key for UI transparent PNGs */
const CREAM = { r: 247, g: 246, b: 242 };

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function isBackgroundPixel(r, g, b, threshold = 28) {
  const creamDist =
    Math.abs(r - CREAM.r) + Math.abs(g - CREAM.g) + Math.abs(b - CREAM.b);
  const nearWhite = r >= 232 && g >= 230 && b >= 225;
  return creamDist <= threshold || nearWhite;
}

/** Cream / near-white → transparent for cleaner UI logos */
async function toTransparentPng(input, output, threshold = 28) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    if (isBackgroundPixel(data[i], data[i + 1], data[i + 2], threshold)) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(output);
}

/** Trim transparent margins, then square-pad with optional inset padding */
async function squarePad(input, size, background, output, padRatio = 0) {
  const trimmed = await sharp(input)
    .trim({ threshold: 1 })
    .png()
    .toBuffer();

  const inner = Math.max(1, Math.round(size * (1 - 2 * padRatio)));
  const resized = await sharp(trimmed)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const bg =
    typeof background === 'string'
      ? background
      : background;

  await writeViaTemp(
    sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: bg,
      },
    }).composite([{ input: resized, gravity: 'centre' }]),
    output,
    false
  );
}

async function writeViaTemp(bufferOrPipeline, destPath, asJpeg = false) {
  const tmpDir = path.join(require('os').tmpdir(), 'zitflow-brand');
  await ensureDir(tmpDir);
  const tmp = path.join(tmpDir, `${path.basename(destPath)}.${Date.now()}.tmp`);

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      if (Buffer.isBuffer(bufferOrPipeline)) {
        await fs.promises.writeFile(tmp, bufferOrPipeline);
      } else {
        if (asJpeg) {
          await bufferOrPipeline.jpeg({ quality: 90 }).toFile(tmp);
        } else {
          await bufferOrPipeline.png().toFile(tmp);
        }
      }
      await fs.promises.rm(destPath, { force: true });
      await fs.promises.copyFile(tmp, destPath);
      await fs.promises.rm(tmp, { force: true });
      return;
    } catch (err) {
      await fs.promises.rm(tmp, { force: true }).catch(() => {});
      if (attempt === 5) throw err;
      await new Promise((r) => setTimeout(r, 200 * attempt));
    }
  }
}

/** Multi-size ICO with embedded PNGs (16 + 32; Vista+ compatible) */
async function writePngIco(pngPaths, outPath) {
  const entries = [];
  for (const p of pngPaths) {
    entries.push(await fs.promises.readFile(p));
  }

  const count = entries.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dataOffset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(count, 4);

  const dirs = [];
  let offset = dataOffset;
  for (let i = 0; i < count; i++) {
    const png = entries[i];
    const meta = await sharp(png).metadata();
    const w = meta.width >= 256 ? 0 : meta.width;
    const h = meta.height >= 256 ? 0 : meta.height;
    const dir = Buffer.alloc(dirEntrySize);
    dir.writeUInt8(w, 0);
    dir.writeUInt8(h, 1);
    dir.writeUInt8(0, 2); // palette
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // planes
    dir.writeUInt16LE(32, 6); // bit count
    dir.writeUInt32LE(png.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirs.push(dir);
    offset += png.length;
  }

  await writeViaTemp(Buffer.concat([header, ...dirs, ...entries]), outPath);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Missing source logo: ${SRC}`);
  }

  const meta = await sharp(SRC).metadata();
  console.log(`Source ${meta.width}x${meta.height} (${meta.format})`);

  const brandDir = path.join(ROOT, 'src/assets/brand');
  const logosDir = path.join(ROOT, 'src/assets/logos');
  const iconsDir = path.join(ROOT, 'src/assets/icons');
  const pwaDir = path.join(ROOT, 'src/assets/pwa');
  const imagesDir = path.join(ROOT, 'src/assets/images');
  const authDir = path.join(ROOT, 'src/assets/images/authentication');
  const srcRoot = path.join(ROOT, 'src');

  await Promise.all(
    [brandDir, logosDir, iconsDir, pwaDir, imagesDir, authDir].map(ensureDir)
  );

  // Full lockup with transparent bg (max width 1200, no unnecessary upscale)
  const lockupTransparent = path.join(brandDir, 'zitflow-lockup.png');
  await toTransparentPng(SRC, lockupTransparent);
  await writeViaTemp(
    sharp(lockupTransparent)
      .trim({ threshold: 1 })
      .resize(1200, null, { fit: 'inside', withoutEnlargement: false }),
    path.join(logosDir, 'zitflow-lockup.png'),
    false
  );

  // Mark: upper portion of the lockup (ZF + drop + olive), no wordmark
  const markCrop = path.join(brandDir, 'zitflow-mark-crop.png');
  const w = meta.width;
  const h = meta.height;
  // Wordmark sits in lower ~35%; keep upper monogram with a little margin
  const top = Math.round(h * 0.04);
  const cropH = Math.round(h * 0.58);
  const left = Math.round(w * 0.12);
  const cropW = Math.round(w * 0.76);

  await sharp(SRC)
    .extract({ left, top, width: cropW, height: cropH })
    .toFile(markCrop);

  const markTransparent = path.join(brandDir, 'zitflow-mark.png');
  await toTransparentPng(markCrop, markTransparent);

  // Master mark 1024×1024 transparent (light inset so edges aren't clipped)
  await squarePad(
    markTransparent,
    1024,
    { r: 0, g: 0, b: 0, alpha: 0 },
    path.join(logosDir, 'zitflow-mark.png'),
    0.04
  );

  // Dark / light invoice fallbacks (same mark on transparent)
  await writeViaTemp(
    sharp(path.join(logosDir, 'zitflow-mark.png')).resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }),
    path.join(imagesDir, 'logo-dark.png'),
    false
  );
  await writeViaTemp(
    sharp(path.join(logosDir, 'zitflow-mark.png')).resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    }),
    path.join(imagesDir, 'logo-white.png'),
    false
  );

  // Auth / legacy path — lockup on transparent (login-adjacent surfaces)
  await writeViaTemp(
    sharp(path.join(logosDir, 'zitflow-lockup.png')).resize(500, null, {
      fit: 'inside',
    }),
    path.join(authDir, 'osm-logo.png'),
    false
  );

  // Favicons — mark only, transparent (no wordmark)
  const favSizes = [
    [16, 'favicon-16.png'],
    [32, 'favicon-32.png'],
    [96, 'favicon-96x96.png'],
  ];
  for (const [size, name] of favSizes) {
    await squarePad(
      path.join(logosDir, 'zitflow-mark.png'),
      size,
      { r: 0, g: 0, b: 0, alpha: 0 },
      path.join(srcRoot, name),
      0.08
    );
  }

  await writePngIco(
    [path.join(srcRoot, 'favicon-16.png'), path.join(srcRoot, 'favicon-32.png')],
    path.join(srcRoot, 'favicon.ico')
  );

  // Apple touch — mark on brand canvas
  await squarePad(
    path.join(logosDir, 'zitflow-mark.png'),
    180,
    CANVAS,
    path.join(srcRoot, 'apple-touch-icon.png'),
    0.1
  );

  // SVG-less favicon reference under images/
  await squarePad(
    path.join(logosDir, 'zitflow-mark.png'),
    128,
    { r: 0, g: 0, b: 0, alpha: 0 },
    path.join(imagesDir, 'favicon.png'),
    0.1
  );

  // App icons — mark centered, ~10–12% padding
  const anySizes = [72, 96, 128, 144, 152, 192, 384, 512];
  for (const size of anySizes) {
    await squarePad(
      path.join(logosDir, 'zitflow-mark.png'),
      size,
      { r: 0, g: 0, b: 0, alpha: 0 },
      path.join(iconsDir, `icon-${size}x${size}.png`),
      0.11
    );
  }

  // Maskable: mark on brand canvas with ~72% safe zone
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.72);
    const markBuf = await sharp(path.join(logosDir, 'zitflow-mark.png'))
      .resize(inner, inner, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    const maskablePath = path.join(pwaDir, `manifest-icon-${size}.maskable.png`);
    await writeViaTemp(
      sharp({
        create: {
          width: size,
          height: size,
          channels: 3,
          background: CANVAS,
        },
      }).composite([{ input: markBuf, gravity: 'centre' }]),
      maskablePath,
      false
    );

    await writeViaTemp(
      await fs.promises.readFile(maskablePath),
      path.join(srcRoot, `web-app-manifest-${size}x${size}.png`)
    );
  }

  await writeViaTemp(
    sharp(path.join(pwaDir, 'manifest-icon-192.maskable.png')).resize(180, 180),
    path.join(pwaDir, 'apple-icon-180.png'),
    false
  );

  // Master for splash screens (mark on canvas)
  const pwaMaster = path.join(brandDir, 'zitflow-pwa-master.png');
  await squarePad(path.join(logosDir, 'zitflow-mark.png'), 1024, CANVAS, pwaMaster, 0.12);

  // Apple splash JPGs via sharp (reliable on Windows; avoids puppeteer file locks)
  const splashSizes = [
    [2048, 2732], [2732, 2048], [1668, 2388], [2388, 1668], [1536, 2048], [2048, 1536],
    [1640, 2360], [2360, 1640], [1668, 2224], [2224, 1668], [1620, 2160], [2160, 1620],
    [1488, 2266], [2266, 1488], [1320, 2868], [2868, 1320], [1206, 2622], [2622, 1206],
    [1290, 2796], [2796, 1290], [1179, 2556], [2556, 1179], [1170, 2532], [2532, 1170],
    [1284, 2778], [2778, 1284], [1125, 2436], [2436, 1125], [1242, 2688], [2688, 1242],
    [828, 1792], [1792, 828], [1242, 2208], [2208, 1242], [750, 1334], [1334, 750],
    [640, 1136], [1136, 640],
  ];

  console.log(`Generating ${splashSizes.length} Apple splash JPGs…`);
  for (const [sw, sh] of splashSizes) {
    const pad = 0.18;
    const maxInner = Math.round(Math.min(sw, sh) * (1 - 2 * pad));
    const logo = await sharp(pwaMaster)
      .resize(maxInner, maxInner, { fit: 'inside' })
      .png()
      .toBuffer();
    const jpegBuf = await sharp({
      create: { width: sw, height: sh, channels: 3, background: CANVAS },
    })
      .composite([{ input: logo, gravity: 'centre' }])
      .jpeg({ quality: 90 })
      .toBuffer();
    await writeViaTemp(jpegBuf, path.join(pwaDir, `apple-splash-${sw}-${sh}.jpg`));
  }

  // Optional puppeteer path (can lock files on Windows). Enable with ENABLE_PWA_ASSET_GEN=1
  if (process.env.ENABLE_PWA_ASSET_GEN === '1') {
    try {
      console.log('Refreshing splash via pwa-asset-generator…');
      await generateImages(pwaMaster, pwaDir, {
        type: 'jpg',
        quality: 90,
        background: CANVAS,
        padding: '18%',
        splashOnly: true,
        pathOverride: 'assets/pwa',
        index: path.join(ROOT, 'src/index.html'),
        manifest: path.join(ROOT, 'src/manifest.webmanifest'),
        log: true,
      });
    } catch (err) {
      console.warn('pwa-asset-generator failed (sharp splash already written):', err.message || err);
    }
  }

  // Useful brand copies of production masters
  await writeViaTemp(
    await fs.promises.readFile(path.join(logosDir, 'zitflow-mark.png')),
    path.join(brandDir, 'zitflow-mark-1024.png')
  );
  await writeViaTemp(
    await fs.promises.readFile(path.join(logosDir, 'zitflow-lockup.png')),
    path.join(brandDir, 'zitflow-lockup-master.png')
  );

  console.log('Done. Logos + PWA assets generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
