import express from 'express';
import { supabase } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// GET ALL INVOICES
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = supabase
      .from('invoices')
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

// CREATE INVOICE FROM ORDER
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { orderId, clientName, clientEmail, amount, taxAmount } = req.body;

    const invoiceNumber = `INV-${Date.now()}`;

    const { data, error } = await supabase
      .from('invoices')
      .insert([{
        user_id: req.user.id,
        order_id: orderId,
        invoice_number: invoiceNumber,
        client_name: clientName,
        client_email: clientEmail,
        amount,
        tax_amount: taxAmount,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        status: 'draft'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GENERATE PDF
router.post('/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !invoice) throw error;

    const doc = new PDFDocument();
    
    // Pipe to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="facture-${invoice.invoice_number}.pdf"`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('FACTURE', 50, 50);
    doc.fontSize(10).font('Helvetica').text(`Numéro: ${invoice.invoice_number}`, 50, 80);
    doc.text(`Date: ${invoice.issue_date}`, 50, 95);
    doc.text(`Échéance: ${invoice.due_date}`, 50, 110);

    // Client
    doc.text('Client:', 50, 150);
    doc.text(invoice.client_name, 50, 165);
    doc.text(invoice.client_email, 50, 180);

    // Totals
    doc.moveTo(50, 300).lineTo(550, 300).stroke();
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`Montant HT: ${invoice.amount}€`, 350, 320);
    doc.text(`TVA: ${invoice.tax_amount}€`, 350, 340);
    doc.text(`Total TTC: ${invoice.amount + invoice.tax_amount}€`, 350, 360);

    doc.end();

    // Update invoice status
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', req.params.id);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
