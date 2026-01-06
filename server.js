import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the SvelteKit app - default export is the request handler
const app = await import('./.svelte-kit/output/server/index.js').then(m => m.default);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = createServer((req, res) => {
	try {
		app(req, res);
	} catch (err) {
		console.error('Request error:', err);
		res.writeHead(500);
		res.end('Internal Server Error');
	}
});

server.listen(PORT, HOST, () => {
	console.log(`✅ Server listening on ${HOST}:${PORT}`);
});

server.on('error', (err) => {
	console.error('❌ Server error:', err);
	process.exit(1);
});

process.on('SIGTERM', () => {
	console.log('SIGTERM received, shutting down gracefully');
	server.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

