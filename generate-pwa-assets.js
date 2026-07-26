/**
 * Deprecated: use `npm run generate-brand`
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('./scripts/generate-zitflow-brand-assets.cjs');
