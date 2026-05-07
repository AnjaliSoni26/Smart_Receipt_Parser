import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseReceiptImage } from '../services/parser.js';
import {
  insertReceipt,
  getAllReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
} from '../queries/receipts.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed'));
    }
  },
});

// POST /api/receipts — upload + parse
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const mimeType = req.file.mimetype as 'image/jpeg' | 'image/png';
    const { parsed, rawOutput, confidenceFlags } = await parseReceiptImage(
      req.file.buffer,
      mimeType
    );

    const receipt = await insertReceipt(
      parsed,
      rawOutput,
      req.file.originalname,
      confidenceFlags
    );

    res.status(201).json(receipt);
  } catch (err) {
    console.error('Parse error:', err);
    res.status(500).json({
      error: 'Failed to parse receipt',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

// GET /api/receipts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const receipts = await getAllReceipts();
    res.json(receipts);
  } catch (err) {
    console.error('GET /api/receipts error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch receipts',
      detail: err instanceof Error ? err.message : String(err)
    });
  }
});

// GET /api/receipts/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const receipt = await getReceiptById(req.params.id);
    if (!receipt) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }
    res.json(receipt);
  } catch (err) {
    console.error('GET /api/receipts/:id error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch receipt',
      detail: err instanceof Error ? err.message : String(err)
    });
  }
});

// PATCH /api/receipts/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const receipt = await updateReceipt(req.params.id, req.body);
    if (!receipt) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }
    res.json(receipt);
  } catch (err) {
    console.error('PATCH /api/receipts/:id error:', err);
    res.status(500).json({ 
      error: 'Failed to update receipt',
      detail: err instanceof Error ? err.message : String(err)
    });
  }
});

// DELETE /api/receipts/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await deleteReceipt(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /api/receipts/:id error:', err);
    res.status(500).json({ 
      error: 'Failed to delete receipt',
      detail: err instanceof Error ? err.message : String(err)
    });
  }
});

export default router;
