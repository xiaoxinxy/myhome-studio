import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {VitePWA} from 'vite-plugin-pwa';
export default defineConfig({base:'./',server:{host:'0.0.0.0',port:5180,watch:{ignored:['**/artifacts/**','**/test-results/**','**/android-app/**','**/安装包/**','**/.npm-cache/**','**/.android-tools/**','**/.android-signing/**']}},plugins:[react(),tailwindcss(),VitePWA({disable:process.env.VITE_NATIVE_APP==='1',registerType:'autoUpdate',includeAssets:['icon.svg'],manifest:{name:'我的家 · 院落设计工作室',short_name:'我的家',theme_color:'#314c42',background_color:'#f6f5f0',display:'standalone',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,png,jpg}'],globIgnores:['**/references/**'],maximumFileSizeToCacheInBytes:4000000}})],build:{chunkSizeWarningLimit:1200}});
