import express from 'express';
import { supabase } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';
import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';

const router = express.Router();

// GET ALL ACCOUNTING ENTRIES
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = supabase
      .from('accounting')
      .select('*')
      .order('date', { ascending: false });

    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Calculer les totaux
    const income = data?.filter(e => e.type === 'income').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const expenses = data?.filter(e => e.type === 'expense').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const taxes = data?.filter(e => e.type === 'tax').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const refunds = data?.filter(e => e.type === 'refund').reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    res.json({
      entries: data || [],
      totals: { income, expenses, taxes, refunds, net: income - expenses - taxes + refunds }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// CREATE ENTRY
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('accounting')
      .insert([{
        user_id: req.user.id,
        ...req.body
      }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// EXPORT CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    let query = supabase.from('accounting').select('*');
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const csvWriter = createObjectCsvWriter({
      path: 'accounting_export.csv',
      header: [
        { id: 'type', title: 'Type' },
        { id: 'category', title: 'Catégorie' },
        { id: 'amount', title: 'Montant' },
        { id: 'date', title: 'Date' },
        { id: 'description', title: 'Description' }
      ]
    });

    await csvWriter.writeRecords(data);
    res.download('accounting_export.csv');
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// EXPORT EXCEL
router.get('/export/excel', authMiddleware, async (req, res) => {
  try {
    let query = supabase.from('accounting').select('*');
    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Comptabilité');

    worksheet.columns = [
      { header: 'Type', key: 'type' },
      { header: 'Catégorie', key: 'category' },
      { header: 'Montant', key: 'amount' },
      { header: 'Date', key: 'date' },
      { header: 'Description', key: 'description' }
    ];

    worksheet.addRows(data);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="comptabilite.xlsx"');
    
    await workbook.xlsx.write(res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
