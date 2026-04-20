import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../config/database.js';
import { io } from '../server.js';

const router = express.Router();

// POST /chat/messages
router.post('/messages', requireAuth, async (req, res) => {
  try {
    const { recipient_id, content } = req.body;
    const sender_id = req.user.id;

    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        sender_id,
        recipient_id,
        content,
        created_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;

    // Emit to recipient via WebSocket
    io.to(recipient_id).emit('newMessage', {
      ...message,
      sender: { id: sender_id, email: req.user.email }
    });

    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /chat/conversations
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: conversations } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, full_name),
        recipient:recipient_id(id, email, full_name)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    // Group by conversation
    const grouped = {};
    conversations?.forEach(msg => {
      const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id;
      if (!grouped[otherId]) {
        grouped[otherId] = {
          userId: otherId,
          user: msg.sender_id === userId ? msg.recipient : msg.sender,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          unread: msg.recipient_id === userId && !msg.read
        };
      }
    });

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /chat/messages/:userId
router.get('/messages/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${currentUserId},recipient_id.eq.${userId}),` +
        `and(sender_id.eq.${userId},recipient_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: true });

    // Mark as read
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', currentUserId)
      .eq('sender_id', userId);

    res.json(messages || []);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
