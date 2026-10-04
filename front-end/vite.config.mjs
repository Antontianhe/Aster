import {defineConfig} from 'vite';
import localSchoolPlugin from '../scripts/local-school-plugin.mjs';
import localPapersPlugin from '../scripts/local-papers-plugin.mjs';
const proxy={'/api':{target:'http://127.0.0.1:5174',changeOrigin:false}};
export default defineConfig({plugins:[localSchoolPlugin(),localPapersPlugin()],server:{host:'127.0.0.1',proxy},preview:{host:'127.0.0.1',proxy},build:{rollupOptions:{output:{manualChunks(id){if(id.includes('node_modules')&&/react(?:-dom)?[\/\\]/.test(id))return'react-vendor';if(id.includes('node_modules')&&/[\/\\](?:motion|framer-motion|motion-dom|motion-utils)[\/\\]/.test(id))return'motion-vendor';if(id.endsWith('translations.generated.json'))return'translations';}}}}});
