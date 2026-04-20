import express from 'express';
import { supabase } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET ALL ADS
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = supabase
      .from('advertisements')
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

// CREATE AD
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .insert([{ user_id: req.user.id, ...req.body }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE AD
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('advertisements')
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

export default router;
