const { createServer } = require('http');
const app = require('./.svelte-kit/output/server/index.js');

const PORT = process.env.PORT || 3000;

const server = createServer(app.default || app);

server.listen(PORT, '0.0.0.0', () => {
	console.log(`✅ Server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
	server.close(() => process.exit(0));
});


