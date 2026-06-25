import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import User from '../models/User';
import { validate } from '../middleware/validate';
import { riskCalculateSchema } from '../middleware/schemas';

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('riskProfile');
    res.json(user!.riskProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/calculate', auth, validate(riskCalculateSchema), async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    const totalScore = answers.reduce((a: number, b: number) => a + b, 0);

    let category = 'Moderate';
    if (totalScore < 15) category = 'Conservative';
    else if (totalScore > 30) category = 'Aggressive';

    const riskProfile = {
      score: totalScore,
      category,
      lastUpdated: new Date()
    };

    await User.findByIdAndUpdate(req.userId, { riskProfile });
    res.json(riskProfile);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
