import { dev } from '$app/environment';

// Handle PORT environment variable for Railway
if (!dev) {
	const port = process.env.PORT || 3000;
	console.log(`Server will listen on port ${port}`);
}

export {};
