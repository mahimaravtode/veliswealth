import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import Insurance from '../models/Insurance';
import { validate } from '../middleware/validate';
import { createInsuranceSchema } from '../middleware/schemas';

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const policies = await Insurance.find({ userId: req.userId });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, validate(createInsuranceSchema), async (req: Request, res: Response) => {
  try {
    const policy = new Insurance({
      ...req.body,
      userId: req.userId
    });
    await policy.save();
    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
