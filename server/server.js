import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.js';
import oppRoutes from './routes/opportunities.js';
import feedRoutes from './routes/feed.js';
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDirectory, '.env') });
dotenv.config({ path: path.join(serverDirectory, '.env.admin') });
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req,res) => res.send('API Running - Backend OK'));

app.use('/api/auth', authRoutes);
app.use('/api/opportunities', oppRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Mongo Connected'))
.catch(e => console.log('Mongo Error', e.message));

app.listen(process.env.PORT || 5000, () => console.log('Backend on http://localhost:5000'));