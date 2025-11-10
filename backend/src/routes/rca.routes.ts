import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth';
import {
  getRCAList,
  getRCADetail,
  createRCA,
  updateRCA,
  deleteRCA,
  addFishboneCause,
  updateFishboneCause,
  deleteFishboneCause,
  addFiveWhys,
  updateFiveWhys,
  deleteFiveWhys,
  addRecommendedAction,
  updateRecommendedAction,
  deleteRecommendedAction,
  approveRCA,
  closeRCA,
  getRCAStatistics,
  getFailurePatterns,
  linkToFailurePattern
} from '../controllers/rca.controller';

const router = express.Router();

// All RCA routes require authentication
router.use(authMiddleware);

// RCA Investigation CRUD
router.get('/', getRCAList);
router.get('/statistics', getRCAStatistics);
router.get('/:id', getRCADetail);
router.post('/', roleMiddleware('admin', 'manager', 'technician'), createRCA);
router.put('/:id', roleMiddleware('admin', 'manager', 'technician'), updateRCA);
router.delete('/:id', roleMiddleware('admin', 'manager'), deleteRCA);

// Fishbone Analysis
router.post('/:rca_id/fishbone', roleMiddleware('admin', 'manager', 'technician'), addFishboneCause);
router.put('/fishbone/:id', roleMiddleware('admin', 'manager', 'technician'), updateFishboneCause);
router.delete('/fishbone/:id', roleMiddleware('admin', 'manager', 'technician'), deleteFishboneCause);

// 5 Whys Analysis
router.post('/:rca_id/five-whys', roleMiddleware('admin', 'manager', 'technician'), addFiveWhys);
router.put('/five-whys/:id', roleMiddleware('admin', 'manager', 'technician'), updateFiveWhys);
router.delete('/five-whys/:id', roleMiddleware('admin', 'manager', 'technician'), deleteFiveWhys);

// Recommended Actions
router.post('/:rca_id/actions', roleMiddleware('admin', 'manager', 'technician'), addRecommendedAction);
router.put('/actions/:id', roleMiddleware('admin', 'manager', 'technician'), updateRecommendedAction);
router.delete('/actions/:id', roleMiddleware('admin', 'manager'), deleteRecommendedAction);

// Approval and Closure
router.post('/:id/approve', roleMiddleware('admin', 'manager'), approveRCA);
router.post('/:id/close', roleMiddleware('admin', 'manager'), closeRCA);

// Failure Patterns
router.get('/patterns/list', getFailurePatterns);
router.post('/patterns/link', roleMiddleware('admin', 'manager'), linkToFailurePattern);

export default router;
