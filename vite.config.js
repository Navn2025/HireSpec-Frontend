import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            events: 'events',
            util: 'util',
        },
    },
    optimizeDeps: {
        include: ['socket.io-client'],
    },
})
