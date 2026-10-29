import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/vinted-sync.js';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'vinted-sync-dev-api',
      configureServer(server) {
        server.middlewares.use('/api/vinted-sync', async (req, res) => {
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          (req as any).query = Object.fromEntries(url.searchParams.entries());
          
          (res as any).status = function(code: number) {
            this.statusCode = code;
            return this;
          };
          (res as any).json = function(data: any) {
            this.setHeader('Content-Type', 'application/json');
            this.end(JSON.stringify(data));
            return this;
          };

          try {
            await handler(req, res);
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e?.message || String(e) }));
          }
        });
      }
    }
  ],
  server: {
    port: 3000,
    open: true
  }
});
