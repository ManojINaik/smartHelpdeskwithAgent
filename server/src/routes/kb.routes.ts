import { Router } from 'express';
import { z } from 'zod';
import KnowledgeBaseService from '../services/kb.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Search KB (public or authenticated user)
router.get('/', async (req, res) => {
  const query = String(req.query.query || '').trim();
  const results = await KnowledgeBaseService.searchArticles(query, false);
  res.json({ results });
});

// Get all articles - admin can see drafts, others see published only
router.get('/all', async (req, res) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const includeUnpublished = isAdmin;
    const results = await KnowledgeBaseService.getAllArticles(includeUnpublished);
    res.json({ results });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'KB_LIST_FAILED', message: err.message } });
  }
});

// Get individual article (public or authenticated user)
router.get('/:id', async (req, res) => {
  try {
    const article = await KnowledgeBaseService.getArticle(req.params.id as string);
    if (!article) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } });
      return;
    }
    res.json({ article });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'KB_GET_FAILED', message: err.message } });
  }
});

// Admin-only: create, update, delete, publish/unpublish
const articleSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().min(5).max(50000),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const data = articleSchema.parse(req.body);
    const createdBy = req.user!.sub;
    const article = await KnowledgeBaseService.createArticle({ ...data, createdBy });
    res.status(201).json({ article });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'KB_CREATE_FAILED', message: err.message } });
  }
});

const updateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  body: z.string().min(5).max(50000).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

router.put('/:id', authenticate, authorize(['admin']), async (req, res): Promise<void> => {
  try {
    const updates = updateSchema.parse(req.body);
    const updated = await KnowledgeBaseService.updateArticle(req.params.id as string, updates);
    if (!updated) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } }); return; }
    res.json({ article: updated });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'KB_UPDATE_FAILED', message: err.message } });
  }
});

router.delete('/:id', authenticate, authorize(['admin']), async (req, res): Promise<void> => {
  await KnowledgeBaseService.deleteArticle(req.params.id as string);
  res.status(204).send();
});

export default router;



