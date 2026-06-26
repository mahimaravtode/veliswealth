import { Router, Request, Response } from 'express';
import auth from '../middleware/auth';
import Goal from '../models/Goal';
import { validate } from '../middleware/validate';
import { createGoalSchema } from '../middleware/schemas';

const router = Router();

router.post('/', auth, validate(createGoalSchema), async (req: Request, res: Response) => {
  try {
    const goal = new Goal({ ...req.body, userId: req.userId });
    await goal.save();
    res.json(goal);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const goals = await Goal.find({ userId: req.userId });
    res.json(goals);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req: Request, res: Response) => {
  try {
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { returnDocument: 'after' }
    );
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
