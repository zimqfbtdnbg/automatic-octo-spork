import { handler } from './.svelte-kit/output/server/index.js';
import http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer(handler);

server.listen(PORT, '0.0.0.0', () => {
	console.log(`✅ Server listening on port ${PORT}`);
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
