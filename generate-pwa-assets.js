import { generateImages } from 'pwa-asset-generator';

(async () => {
  try {
    const { savedImages } = await generateImages('src/assets/OSM.svg', 'src/assets/pwa', {
      type: 'png',
      quality: 90,
      background: '#4680ff',
      padding: '10%',
      manifest: 'src/manifest.webmanifest',
      pathOverride: 'assets/pwa',
      iconOnly: true,
      index: 'src/index.html',
      log: true
    });

    console.log('Generated PWA assets:', savedImages);
  } catch (error) {
    console.error('Error generating PWA assets:', error);
    process.exit(1);
  }
})();
