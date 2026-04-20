import express from 'express';
import { supabase } from '../server.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET ALL ORDERS (User's or All for Admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        client:clients(name, email),
        items:order_items(*)
      `);

    // Si pas admin, uniquement ses commandes
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CREATE ORDER
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, items, totalAmount, shippingAddress } = req.body;

    // Générer numéro commande
    const orderNumber = `ORD-${Date.now()}`;

    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          user_id: req.user.id,
          client_id: clientId,
          order_number: orderNumber,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Ajouter les articles
    const orderItems = items.map(item => ({
      order_id: data.id,
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.quantity * item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE ORDER STATUS
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: status || undefined,
        payment_status: paymentStatus || undefined,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE ORDER
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
