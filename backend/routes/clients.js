import express from 'express';
import { supabase } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET ALL CLIENTS
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

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

// CREATE CLIENT
router.post('/', authMiddleware, async (req, res) => {
  try {
    const clientData = {
      user_id: req.user.id,
      ...req.body
    };

    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE CLIENT
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE CLIENT
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
