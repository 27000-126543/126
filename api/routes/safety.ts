import { Router } from 'express';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import {
  getSensors, getSensorReadings, submitSensorReading,
  getAlarms, acknowledgeAlarm,
  issueEvacuationOrder, getCurrentEvacuation, completeEvacuation,
  getIncidents, createIncident
} from '../controllers/safetyController.js';

const router = Router();

router.get('/sensors', authMiddleware, getSensors);
router.get('/sensors/:id/readings', authMiddleware, getSensorReadings);
router.post('/sensors/readings', authMiddleware, submitSensorReading);

router.get('/safety/alarms', authMiddleware, getAlarms);
router.post('/safety/alarms/:id/acknowledge', authMiddleware, requireRoles('safety_officer', 'project_manager'), acknowledgeAlarm);

router.post('/safety/evacuation', authMiddleware, requireRoles('safety_officer', 'project_manager'), issueEvacuationOrder);
router.get('/safety/evacuation/current', authMiddleware, getCurrentEvacuation);
router.post('/safety/evacuation/:id/complete', authMiddleware, requireRoles('safety_officer', 'project_manager'), completeEvacuation);

router.get('/safety/incidents', authMiddleware, getIncidents);
router.post('/safety/incidents', authMiddleware, requireRoles('safety_officer', 'project_manager'), createIncident);

export default router;
