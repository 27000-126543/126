import { db } from '../data/database.js';
import { safetyMonitoringService } from './safetyMonitoringService.js';
import type { Sensor, Worker, Equipment } from '../../shared/types.js';

export function startSensorSimulator(): void {
  const sensors = db.getAll('sensors') as Sensor[];

  setInterval(() => {
    sensors.forEach((sensor) => {
      if (sensor.status === 'offline' || sensor.status === 'fault') return;

      let baseValue = 0;
      let variation = 0;

      switch (sensor.type) {
        case 'noise':
          baseValue = 60;
          variation = 35;
          break;
        case 'dust':
          baseValue = 100;
          variation = 120;
          break;
        case 'tower_crane':
          baseValue = 1.5;
          variation = 3;
          break;
        case 'temperature':
          baseValue = 28;
          variation = 12;
          break;
        case 'humidity':
          baseValue = 55;
          variation = 35;
          break;
      }

      const randomFactor = Math.random();
      let value = baseValue + Math.random() * variation;

      if (randomFactor > 0.95) {
        value = sensor.threshold.critical + Math.random() * 10;
      } else if (randomFactor > 0.85) {
        value = sensor.threshold.warning + Math.random() * 5;
      }

      value = parseFloat(value.toFixed(1));
      safetyMonitoringService.processReading(sensor, value);
    });
  }, 5000);

  console.log('Sensor simulator started');
}

export function startLocationSimulator(): void {
  setInterval(() => {
    const workers = db.query('workers', w => w.status === 'on_site') as Worker[];
    const equipment = db.query('equipment', e => e.status === 'in_use') as Equipment[];

    workers.forEach((worker) => {
      if (!worker.currentLocation) return;

      const dx = (Math.random() - 0.5) * 20;
      const dy = (Math.random() - 0.5) * 20;

      const newX = Math.max(50, Math.min(750, worker.currentLocation.x + dx));
      const newY = Math.max(50, Math.min(550, worker.currentLocation.y + dy));

      db.update('workers', worker.id, {
        currentLocation: {
          x: newX,
          y: newY,
          area: worker.currentLocation.area
        }
      });
    });

    equipment.forEach((eq) => {
      const update: Partial<Equipment> = {};
      if (Math.random() > 0.7) {
        update.totalRuntime = eq.totalRuntime + 0.08;
        update.nextMaintenanceHours = Math.max(0, eq.nextMaintenanceHours - 0.08);
        db.update('equipment', eq.id, update);
      }
    });

    const locations = [
      ...workers.map(w => ({
        entityType: 'worker' as const,
        entityId: w.id,
        x: w.currentLocation?.x || 0,
        y: w.currentLocation?.y || 0,
        area: w.currentLocation?.area || '',
        timestamp: new Date().toISOString()
      })),
      ...equipment.map(e => ({
        entityType: 'equipment' as const,
        entityId: e.id,
        x: 150 + Math.random() * 300,
        y: 150 + Math.random() * 200,
        area: e.location,
        timestamp: new Date().toISOString()
      }))
    ];

    db.emit('websocket', {
      type: 'location_update',
      data: locations,
      timestamp: new Date().toISOString()
    });
  }, 3000);

  console.log('Location simulator started');
}
