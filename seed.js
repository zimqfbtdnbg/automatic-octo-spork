import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'belatube.db'));

// Ensure schema exists (same as runtime DB schema)
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		email TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL,
		avatar TEXT,
		banner TEXT,
		description TEXT,
		role TEXT DEFAULT 'user',
		is_scam INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS videos (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		description TEXT,
		video_url TEXT NOT NULL,
		thumbnail_url TEXT,
		thumbnail TEXT,
		duration INTEGER DEFAULT 0,
		views INTEGER DEFAULT 0,
		is_18 INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS comments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		video_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		parent_id INTEGER,
		content TEXT NOT NULL,
		is_pinned INTEGER DEFAULT 0,
		is_hearted INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS comment_likes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		comment_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		type TEXT CHECK(type IN ('like', 'dislike')) NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(comment_id, user_id),
		FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS likes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		video_id INTEGER NOT NULL,
		user_id INTEGER NOT NULL,
		type TEXT CHECK(type IN ('like', 'dislike')) NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(video_id, user_id),
		FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS subscriptions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		subscriber_id INTEGER NOT NULL,
		channel_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(subscriber_id, channel_id),
		FOREIGN KEY (subscriber_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (channel_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS watch_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		video_id INTEGER NOT NULL,
		watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
	CREATE INDEX IF NOT EXISTS idx_comments_video_id ON comments(video_id);
	CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
	CREATE INDEX IF NOT EXISTS idx_likes_video_id ON likes(video_id);
	CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
	CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_id);
	CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON subscriptions(channel_id);
	CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id);
`);

console.log('🌱 Seeding database...');

const hashedPassword = bcrypt.hashSync('password123', 10);

// Moderator account
const modHashed = bcrypt.hashSync('modpass123', 10);
const moderator = db.prepare(`
	INSERT OR IGNORE INTO users (username, email, password, avatar, description, role, is_scam)
	VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
	'Moderator',
	'moderator@belatube.local',
	modHashed,
	'https://ui-avatars.com/api/?name=Moderator&background=1abc9c&color=fff',
	'Platform moderator account',
	'moderator',
	0
);

const user1 = db.prepare(`
	INSERT OR IGNORE INTO users (username, email, password, avatar, description, role, is_scam)
	VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
	'TechGuru',
	'tech@example.com',
	hashedPassword,
	'https://ui-avatars.com/api/?name=TechGuru&background=9b59b6&color=fff',
	'Technology enthusiast sharing cool tech videos!',
	'user',
	0
);

const user2 = db.prepare(`
	INSERT OR IGNORE INTO users (username, email, password, avatar, description, role, is_scam)
	VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
	'CookingMaster',
	'cook@example.com',
	hashedPassword,
	'https://ui-avatars.com/api/?name=CookingMaster&background=b174d4&color=fff',
	'Delicious recipes and cooking tips!',
	'user',
	0
);

const user3 = db.prepare(`
	INSERT OR IGNORE INTO users (username, email, password, avatar, description, role, is_scam)
	VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
	'GamePlayer',
	'gamer@example.com',
	hashedPassword,
	'https://ui-avatars.com/api/?name=GamePlayer&background=8e44ad&color=fff',
	'Epic gaming moments and walkthroughs!',
	'user',
	0
);

// Resolve inserted user ids (works if inserts were ignored on re-run)
const moderatorRow = db.prepare('SELECT id FROM users WHERE email = ?').get('moderator@belatube.local');
const user1Row = db.prepare('SELECT id FROM users WHERE email = ?').get('tech@example.com');
const user2Row = db.prepare('SELECT id FROM users WHERE email = ?').get('cook@example.com');
const user3Row = db.prepare('SELECT id FROM users WHERE email = ?').get('gamer@example.com');

const moderatorId = moderatorRow ? moderatorRow.id : null;
const user1Id = user1Row ? user1Row.id : null;
const user2Id = user2Row ? user2Row.id : null;
const user3Id = user3Row ? user3Row.id : null;

const videos = [
	{
		userId: user1Id,
		title: 'Introduction to JavaScript ES2024',
		description: 'Learn about the latest features in JavaScript ES2024. Perfect for beginners and advanced developers!',
		thumbnail: 'https://picsum.photos/seed/js/1280/720',
		duration: 840
	},
	{
		userId: user1Id,
		title: 'Building a REST API with Node.js',
		description: 'Complete tutorial on creating a RESTful API using Node.js and Express.',
		thumbnail: 'https://picsum.photos/seed/nodejs/1280/720',
		duration: 1200
	},
	{
		userId: user2Id,
		title: 'Perfect Homemade Pizza Recipe',
		description: 'Make the best pizza at home with this simple recipe. Crispy crust, amazing taste!',
		thumbnail: 'https://picsum.photos/seed/pizza/1280/720',
		duration: 600
	},
	{
		userId: user2Id,
		title: 'Quick & Healthy Breakfast Ideas',
		description: '5 breakfast recipes you can make in under 10 minutes. Delicious and nutritious!',
		thumbnail: 'https://picsum.photos/seed/breakfast/1280/720',
		duration: 480
	},
	{
		userId: user3Id,
		title: 'Epic Game Highlights - Best Moments',
		description: 'The most amazing gaming moments from last week. You won\'t believe #3!',
		thumbnail: 'https://picsum.photos/seed/gaming/1280/720',
		duration: 720
	},
	{
		userId: user3Id,
		title: 'Complete Walkthrough - Level 10',
		description: 'Detailed walkthrough of level 10 with all secrets and collectibles.',
		thumbnail: 'https://picsum.photos/seed/walkthrough/1280/720',
		duration: 960
	},
	{
		userId: user1Id,
		title: 'TypeScript Tips & Tricks',
		description: '10 TypeScript tips that will make you a better developer.',
		thumbnail: 'https://picsum.photos/seed/typescript/1280/720',
		duration: 540
	},
	{
		userId: user2Id,
		title: 'Baking the Perfect Chocolate Cake',
		description: 'Step-by-step guide to baking a moist and delicious chocolate cake.',
		thumbnail: 'https://picsum.photos/seed/cake/1280/720',
		duration: 900
	}
];

videos.forEach((video) => {
	const result = db.prepare(`
		INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, duration, views, is_18)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		video.userId,
		video.title,
		video.description,
		'/uploads/sample-video.mp4',
		video.thumbnail,
		video.duration,
		Math.floor(Math.random() * 100000),
		0
	);

	const videoId = result.lastInsertRowid;

	const randomLikes = Math.floor(Math.random() * 1000) + 100;
	const randomDislikes = Math.floor(Math.random() * 50);

	for (let i = 0; i < Math.min(randomLikes, 20); i++) {
		try {
			db.prepare(`
				INSERT INTO likes (video_id, user_id, type)
				VALUES (?, ?, 'like')
			`).run(videoId, Math.floor(Math.random() * 3) + 1);
		} catch (e) {}
	}

	db.prepare(`
		INSERT INTO comments (video_id, user_id, content)
		VALUES (?, ?, ?)
	`).run(videoId, Math.floor(Math.random() * 3) + 1, 'Great video! Thanks for sharing!');

	db.prepare(`
		INSERT INTO comments (video_id, user_id, content)
		VALUES (?, ?, ?)
	`).run(videoId, Math.floor(Math.random() * 3) + 1, 'Very helpful content 👍');
});

db.prepare('INSERT OR IGNORE INTO subscriptions (subscriber_id, channel_id) VALUES (?, ?)').run(1, 2);
db.prepare('INSERT OR IGNORE INTO subscriptions (subscriber_id, channel_id) VALUES (?, ?)').run(1, 3);
db.prepare('INSERT OR IGNORE INTO subscriptions (subscriber_id, channel_id) VALUES (?, ?)').run(2, 1);
db.prepare('INSERT OR IGNORE INTO subscriptions (subscriber_id, channel_id) VALUES (?, ?)').run(3, 1);

console.log('✅ Database seeded successfully!');
console.log('\nTest accounts:');
console.log('- tech@example.com / password123');
console.log('- cook@example.com / password123');
console.log('- gamer@example.com / password123');
console.log('- moderator@belatube.local / modpass123 (moderator)');

db.close();
