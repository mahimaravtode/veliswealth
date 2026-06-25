import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import Asset from '../models/Asset';
import { validate } from '../middleware/validate';
import { createAssetSchema } from '../middleware/schemas';

const router = Router();

router.get('/net-worth', auth, async (req: Request, res: Response) => {
  try {
    const assets = await Asset.find({ userId: req.userId });

    let totalAssets = 0;
    let totalLiabilities = 0;

    assets.forEach(a => {
      if (a.category === 'Asset') totalAssets += a.currentValue;
      else totalLiabilities += a.currentValue;
    });

    res.json({
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/asset', auth, validate(createAssetSchema), async (req: Request, res: Response) => {
  try {
    const asset = new Asset({ ...req.body, userId: req.userId });
    await asset.save();
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
