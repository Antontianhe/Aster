import {defineConfig} from 'vite';
import localSchoolPlugin from '../scripts/local-school-plugin.mjs';
const proxy={'/api':{target:'http://127.0.0.1:5174',changeOrigin:false}};
export default defineConfig({plugins:[localSchoolPlugin()],server:{host:'127.0.0.1',proxy},preview:{host:'127.0.0.1',proxy},build:{rollupOptions:{output:{manualChunks(id){if(id.includes('node_modules')&&/react(?:-dom)?[\/\\]/.test(id))return'react-vendor';if(id.endsWith('translations.generated.json'))return'translations';}}}}});
