import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { handleTurnMock } from './api/turn';

// Middleware to serve /api/turn during local Vite dev
function mockApiPlugin() {
  return {
    name: 'mock-api-turn',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/turn' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk: any) => {
            bodyStr += chunk;
          });
          req.on('end', () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const result = handleTurnMock(body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(
                JSON.stringify({
                  state: null,
                  nova: {
                    line: 'Communication packet scrambled. Re-transmitting telemetry.',
                    responseType: 'refuse',
                    mood: 'calm'
                  },
                  actions: [],
                  scare: null,
                  events: [],
                  error: err?.message || 'Error processing request'
                })
              );
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    port: 3000,
    host: true,
    watch: {
      ignored: ['**/*.md', '**/tests/**']
    }
  }
});
