import { createServer } from 'http';

const app = (await import('./.svelte-kit/output/server/index.js')).default;
const PORT = process.env.PORT || 3000;

const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
	console.log(`✅ Server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
	server.close(() => process.exit(0));
});



