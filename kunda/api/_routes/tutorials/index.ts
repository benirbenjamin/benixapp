// =====================================================================
// GET & POST /api/tutorials - Registration & Onboarding Tutorials
// =====================================================================
import crypto from 'crypto';
import { extractAuthUser, isAuthorizedRole } from '../../_lib/auth.js';
import { memoryStore } from '../../_lib/db.js';

export default async function handler(req: any, res: any) {
  // GET: Fetch tutorials (available publicly for registration & onboarding)
  if (req.method === 'GET') {
    const stepTag = req.query?.step;
    const all = req.query?.all === 'true';

    let list = memoryStore.tutorials || [];

    if (!all) {
      list = list.filter((t) => t.isActive !== false);
    }

    if (stepTag && stepTag !== 'all') {
      list = list.filter((t) => t.stepTag === stepTag || t.stepTag === 'all');
    }

    list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return res.status(200).json({ success: true, tutorials: list });
  }

  // POST: Admin tutorial management (Create, Update, Delete)
  if (req.method === 'POST') {
    const auth = extractAuthUser(req);
    if (!auth || !isAuthorizedRole(auth.role, ['super_admin', 'admin'])) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }

    const { action, tutorialId, title_en, title_rw, title_fr, content_en, content_rw, content_fr, videoUrl, imageUrl, stepTag, displayOrder, isActive } = req.body;

    if (action === 'create') {
      const newTutorial = {
        id: crypto.randomUUID(),
        title_en: title_en || 'Tutorial Title',
        title_rw: title_rw || title_en || "Umutwe w'inyoborabumenyi",
        title_fr: title_fr || title_en || 'Titre du Tutoriel',
        content_en: content_en || '',
        content_rw: content_rw || content_en || '',
        content_fr: content_fr || content_en || '',
        videoUrl: videoUrl || '',
        imageUrl: imageUrl || '',
        stepTag: stepTag || 'all',
        displayOrder: parseInt(displayOrder, 10) || 0,
        isActive: isActive !== false,
        createdAt: new Date().toISOString(),
      };

      memoryStore.tutorials.push(newTutorial);
      return res.status(201).json({ success: true, tutorial: newTutorial });
    }

    if (action === 'update') {
      const target = memoryStore.tutorials.find((t) => t.id === tutorialId);
      if (!target) return res.status(404).json({ success: false, error: 'Tutorial not found' });

      if (title_en !== undefined) target.title_en = title_en;
      if (title_rw !== undefined) target.title_rw = title_rw;
      if (title_fr !== undefined) target.title_fr = title_fr;
      if (content_en !== undefined) target.content_en = content_en;
      if (content_rw !== undefined) target.content_rw = content_rw;
      if (content_fr !== undefined) target.content_fr = content_fr;
      if (videoUrl !== undefined) target.videoUrl = videoUrl;
      if (imageUrl !== undefined) target.imageUrl = imageUrl;
      if (stepTag !== undefined) target.stepTag = stepTag;
      if (displayOrder !== undefined) target.displayOrder = parseInt(displayOrder, 10);
      if (isActive !== undefined) target.isActive = isActive;

      return res.status(200).json({ success: true, tutorial: target });
    }

    if (action === 'delete') {
      const index = memoryStore.tutorials.findIndex((t) => t.id === tutorialId);
      if (index === -1) return res.status(404).json({ success: false, error: 'Tutorial not found' });

      memoryStore.tutorials.splice(index, 1);
      return res.status(200).json({ success: true, message: 'Tutorial deleted successfully' });
    }

    if (action === 'toggle_active') {
      const target = memoryStore.tutorials.find((t) => t.id === tutorialId);
      if (!target) return res.status(404).json({ success: false, error: 'Tutorial not found' });

      target.isActive = !target.isActive;
      return res.status(200).json({ success: true, isActive: target.isActive });
    }

    return res.status(400).json({ success: false, error: 'Invalid tutorial action' });
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
