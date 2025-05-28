import generateAssets from 'pwa-asset-generator';

// Generate PWA assets
(async () => {
  try {
    const { savedImages, htmlMeta, manifestJsonContent } = await generateAssets(
      'src/assets/OSM.svg', // Using the OSM SVG logo
      'src/assets/pwa', // Output directory
      {
        type: 'png',
        quality: 90,
        background: '#4680ff', // Using the logo's fill color
        padding: '10%',
        manifest: 'src/manifest.webmanifest',
        pathOverride: '/assets/pwa',
        mstile: true,
        appleTouchBackground: '#4680ff',
        appleTouchPadding: '10%',
        appleTouchIcon: true,
        appleTouchStartupImage: true,
        appleTouchStartupImageBackground: '#4680ff',
        appleTouchStartupImagePadding: '10%',
        appleTouchStartupImageSize: [
          { width: 640, height: 1136 },
          { width: 750, height: 1334 },
          { width: 1242, height: 2208 },
          { width: 1125, height: 2436 },
          { width: 1536, height: 2048 },
          { width: 1668, height: 2224 },
          { width: 2048, height: 2732 }
        ],
        iconOnly: true,
        opaque: false,
        scrape: false,
        index: 'src/index.html',
        log: true
      }
    );

    console.log('Generated PWA assets:', savedImages);
    console.log('Generated HTML meta tags:', htmlMeta);
    console.log('Generated manifest content:', manifestJsonContent);
  } catch (error) {
    console.error('Error generating PWA assets:', error);
  }
})(); 