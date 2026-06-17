import { Router, Response } from 'express';
import { AuthRequest } from '../types';

const router = Router();

const IPO_DATA = {
  upcoming: [
    { companyName: 'boAt Lifestyle', symbol: 'BOAT', priceBand: '₹325 - ₹345', lotSize: 43, openDate: '2026-06-20', closeDate: '2026-06-23', status: 'Upcoming', exchange: 'NSE/BSE', issueSize: '₹2,000 Cr', gmp: '+₹55', type: 'Book Built', qib: '-', retail: '-', nii: '-' },
    { companyName: 'OYO (Oravel Stays)', symbol: 'OYO', priceBand: '₹810 - ₹850', lotSize: 17, openDate: '2026-06-25', closeDate: '2026-06-27', status: 'Upcoming', exchange: 'NSE/BSE', issueSize: '₹8,430 Cr', gmp: '+₹120', type: 'Book Built', qib: '-', retail: '-', nii: '-' },
    { companyName: 'Lenskart Solutions', symbol: 'LENSKART', priceBand: '₹900 - ₹950', lotSize: 15, openDate: '2026-07-01', closeDate: '2026-07-03', status: 'Upcoming', exchange: 'NSE/BSE', issueSize: '₹4,500 Cr', gmp: '+₹85', type: 'Book Built', qib: '-', retail: '-', nii: '-' },
    { companyName: 'PhysicsWallah', symbol: 'PW', priceBand: '₹425 - ₹450', lotSize: 33, openDate: '2026-07-08', closeDate: '2026-07-10', status: 'Upcoming', exchange: 'NSE', issueSize: '₹3,200 Cr', gmp: '+₹38', type: 'Book Built', qib: '-', retail: '-', nii: '-' },
    { companyName: 'Zepto (KiranaKart)', symbol: 'ZEPTO', priceBand: '₹1,100 - ₹1,180', lotSize: 12, openDate: '2026-07-15', closeDate: '2026-07-17', status: 'Upcoming', exchange: 'NSE/BSE', issueSize: '₹5,000 Cr', gmp: '+₹210', type: 'Book Built', qib: '-', retail: '-', nii: '-' },
    { companyName: 'boAt Lifestyle (Suggested)', symbol: 'BOAT', priceBand: '₹325 - ₹345', lotSize: 43, openDate: '2026-06-20', closeDate: '2026-06-23', status: 'Upcoming', exchange: 'NSE/BSE', issueSize: '₹2,000 Cr', gmp: '+₹55', type: 'Book Built', qib: '-', retail: '-', nii: '-' }
  ],
  ongoing: [
    { companyName: 'Nuvama Wealth Management', symbol: 'NUVAMA', priceBand: '₹520 - ₹545', lotSize: 27, openDate: '2026-06-12', closeDate: '2026-06-16', status: 'Ongoing', exchange: 'NSE/BSE', issueSize: '₹1,200 Cr', gmp: '+₹42', type: 'Book Built', qib: '2.1x', retail: '3.8x', nii: '2.5x' },
    { companyName: 'Motilal Oswal MF IPO Fund', symbol: 'MOAMC', priceBand: '₹150 - ₹158', lotSize: 95, openDate: '2026-06-14', closeDate: '2026-06-18', status: 'Ongoing', exchange: 'NSE', issueSize: '₹780 Cr', gmp: '+₹18', type: 'Book Built', qib: '1.8x', retail: '4.2x', nii: '2.1x' }
  ],
  recentlyClosed: [
    { companyName: 'FirstCry (Brainbees Solutions)', symbol: 'FIRSTCRY', priceBand: '₹440 - ₹465', lotSize: 32, openDate: '2026-05-20', closeDate: '2026-05-22', status: 'Listed', exchange: 'NSE/BSE', issueSize: '₹4,187 Cr', listingGain: '+18.5%', gmp: '+₹85', type: 'Book Built', qib: '5.2x', retail: '8.1x', nii: '6.3x' },
    { companyName: 'TBO Tek (TBO Holidays)', symbol: 'TBOTEK', priceBand: '₹295 - ₹310', lotSize: 48, openDate: '2026-05-15', closeDate: '2026-05-17', status: 'Listed', exchange: 'NSE/BSE', issueSize: '₹1,600 Cr', listingGain: '+32.1%', gmp: '+₹62', type: 'Book Built', qib: '4.8x', retail: '9.2x', nii: '5.7x' },
    { companyName: 'KRN Heat Exchanger', symbol: 'KRN', priceBand: '₹215 - ₹225', lotSize: 66, openDate: '2026-05-10', closeDate: '2026-05-12', status: 'Listed', exchange: 'BSE', issueSize: '₹450 Cr', listingGain: '+45.2%', gmp: '+₹48', type: 'Book Built', qib: '3.5x', retail: '11.4x', nii: '4.2x' },
    { companyName: 'Emcure Pharmaceuticals', symbol: 'EMCURE', priceBand: '₹960 - ₹1,008', lotSize: 14, openDate: '2026-04-28', closeDate: '2026-04-30', status: 'Listed', exchange: 'NSE/BSE', issueSize: '₹1,952 Cr', listingGain: '+12.3%', gmp: '+₹78', type: 'Book Built', qib: '6.1x', retail: '7.8x', nii: '5.9x' },
    { companyName: 'IXIGO (Le Travenues)', symbol: 'IXIGO', priceBand: '₹85 - ₹88', lotSize: 170, openDate: '2026-04-22', closeDate: '2026-04-24', status: 'Listed', exchange: 'NSE/BSE', issueSize: '₹602 Cr', listingGain: '+24.7%', gmp: '+₹22', type: 'Book Built', qib: '3.9x', retail: '12.5x', nii: '4.8x' }
  ]
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    res.json(IPO_DATA);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
