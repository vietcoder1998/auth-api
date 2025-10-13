

import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import authRouter from './routes/auth.routes';
dotenv.config();

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.get('/', (req, res) => res.json({ status: 'ok' }));

// Serve admin GUI at /admin
app.use('/admin', express.static(path.join(__dirname, 'gui')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth API running on port ${PORT}`);
  console.log(`Admin GUI available at http://localhost:${PORT}/admin`);
});
