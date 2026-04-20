import express from 'express';
import { supabase } from '../server.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

// GET ALL USERS
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, username, role, plan, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET USER STATS
router.get('/stats', async (req, res) => {
  try {
    const { data: totalUsers } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const { data: totalOrders } = await supabase
      .from('orders')
      .select('id', { count: 'exact' });

    const { data: totalRevenue } = await supabase
      .from('orders')
      .select('total_amount');

    const revenue = totalRevenue?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    res.json({
      totalUsers: totalUsers?.length || 0,
      totalOrders: totalOrders?.length || 0,
      totalRevenue: revenue
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE USER PLAN
router.patch('/users/:id/plan', async (req, res) => {
  try {
    const { plan } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ plan })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE USER
router.delete('/users/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { supabase } from '../config/database.js';

const router = express.Router();

// GET /admin/stats
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Utilisateurs actifs
    const { data: users } = await supabase
      .from('users')
      .select('id, role');

    const activeUsers = users?.length || 0;
    const adminCount = users?.filter(u => u.role === 'admin').length || 0;

    // Revenus totaux
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount');

    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const totalOrders = orders?.length || 0;

    // Clients totaux
    const { data: clients } = await supabase
      .from('clients')
      .select('id');

    const totalClients = clients?.length || 0;

    // Produits totaux
    const { data: products } = await supabase
      .from('products')
      .select('id');

    const totalProducts = products?.length || 0;

    // Revenue par mois (dernier 6 mois)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startMonth.toISOString())
        .lte('created_at', endMonth.toISOString());

      const monthTotal = monthOrders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      monthlyRevenue.push(monthTotal);
    }

    res.json({
      activeUsers,
      adminCount,
      inactiveUsers: activeUsers - adminCount,
      totalRevenue,
      totalOrders,
      totalClients,
      totalProducts,
      monthlyRevenue
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /admin/users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    res.json(users || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /admin/users/:userId
router.patch('/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name, username, role } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({ full_name, username, role, updated_at: new Date() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /admin/users/:userId
router.delete('/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /admin/orders
router.get('/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        *,
        clients (full_name),
        users (email)
      `)
      .order('created_at', { ascending: false });

    const formattedOrders = orders?.map(o => ({
      ...o,
      client_name: o.clients?.full_name,
      user_email: o.users?.email
    })) || [];

    res.json(formattedOrders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /admin/clients
router.get('/clients', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    res.json(clients || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /admin/products
router.get('/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    res.json(products || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /admin/export
router.get('/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Export toutes les données
    const { data: users } = await supabase.from('users').select('*');
    const { data: orders } = await supabase.from('orders').select('*');
    const { data: clients } = await supabase.from('clients').select('*');

    const csv = `UTILISATEURS\n${JSON.stringify(users)}\n\nCOMMANDES\n${JSON.stringify(orders)}\n\nCLIENTS\n${JSON.stringify(clients)}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
    res.send(csv);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;

