import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import clientsRoutes from './routes/clients.js';
import productsRoutes from './routes/products.js';
import invoicesRoutes from './routes/invoices.js';
import accountingRoutes from './routes/accounting.js';
import adsRoutes from './routes/ads.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Supabase
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
