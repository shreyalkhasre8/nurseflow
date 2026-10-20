import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { db, initDatabase } from './config/db.js';
import { apiRouter } from './routes/api.js';
import { runSeed } from './seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize DB schema
initDatabase();

// Check if user table has data; if not, automatically run seed
try {
  const userCount = db.prepare(`SELECT COUNT(*) as count FROM users`).get() as any;
  if (!userCount || userCount.count === 0) {
    console.log('Database empty. Running seed...');
    runSeed();
  }
} catch (err) {
  console.log('Seeding initial dataset...');
  runSeed();
}

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    application: 'NurseFlow Clinical System',
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend in production if built
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // Catch-all fallback for client-side React Router in Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'A clinical system error occurred. Please try again or report to hospital IT support.'
  });
});

app.listen(PORT, () => {
  console.log(`🏥 NurseFlow Server is running securely on http://localhost:${PORT}`);
});
