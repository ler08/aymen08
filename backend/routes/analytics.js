import express from 'express';
import { supabase } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET DASHBOARD STATS
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    // Commandes ce mois
    const monthStart = new Date();
    monthStart.setDate(1);

    let ordersQuery = supabase
      .from('orders')
      .select('total_amount, created_at');

    if (req.user.role !== 'admin') {
      ordersQuery = ordersQuery.eq('user_id', req.user.id);
    }

    const { data: orders } = await ordersQuery;
    
    const monthOrders = orders?.filter(o => new Date(o.created_at) >= monthStart) || [];
    const monthRevenue = monthOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Clients
    let clientsQuery = supabase.from('clients').select('id');
    if (req.user.role !== 'admin') {
      clientsQuery = clientsQuery.eq('user_id', req.user.id);
    }
    const { data: clients } = await clientsQuery;

    res.json({
      monthRevenue,
      monthOrders: monthOrders.length,
      totalClients: clients?.length || 0,
      totalRevenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
