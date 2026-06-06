import type { Sensor, SensorReading, SafetyAlarm, WebSocketMessage } from '../../shared/types.js';
import { db } from '../data/database.js';
import { v4 as uuidv4 } from 'uuid';

export class SafetyMonitoringService {
  processReading(sensor: Sensor, value: number): SensorReading {
    const now = new Date().toISOString();
    let level: 'normal' | 'warning' | 'critical' = 'normal';

    if (value >= sensor.threshold.critical) {
      level = 'critical';
    } else if (value >= sensor.threshold.warning) {
      level = 'warning';
    }

    const reading = db.create('sensorReadings', {
      sensorId: sensor.id,
      value,
      timestamp: now,
      level
    }) as SensorReading;

    if (level === 'warning' || level === 'critical') {
      const recentAlarm = db.query('safetyAlarms',
        a => a.sensorId === sensor.id && !a.acknowledged
      )[0];

      if (!recentAlarm) {
        this.createAlarm(sensor, value, level);
      }
    }

    const message: WebSocketMessage = {
      type: 'sensor_reading',
      data: reading,
      timestamp: now
    };
    db.emit('websocket', message);

    return reading;
  }

  private createAlarm(sensor: Sensor, value: number, level: 'warning' | 'critical'): SafetyAlarm {
    const typeNames: Record<string, string> = {
      noise: '噪音',
      dust: '粉尘',
      tower_crane: '塔吊倾斜',
      temperature: '温度',
      humidity: '湿度'
    };

    const unitNames: Record<string, string> = {
      noise: 'dB',
      dust: 'μg/m³',
      tower_crane: '°',
      temperature: '°C',
      humidity: '%'
    };

    const alarm = db.create('safetyAlarms', {
      sensorId: sensor.id,
      type: sensor.type,
      level,
      message: `${typeNames[sensor.type] || sensor.type}数值${value}${unitNames[sensor.type] || ''}超过${level === 'critical' ? '临界' : '预警'}阈值，请立即处理`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null
    }) as SafetyAlarm;

    const message: WebSocketMessage = {
      type: 'alarm',
      data: alarm,
      timestamp: new Date().toISOString()
    };
    db.emit('websocket', message);

    return alarm;
  }

  acknowledgeAlarm(alarmId: string, userId: string): SafetyAlarm | undefined {
    return db.update('safetyAlarms', alarmId, {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date().toISOString()
    }) as SafetyAlarm | undefined;
  }

  issueEvacuationOrder(issuerId: string, area: string, reason: string) {
    const order = db.create('evacuationOrders', {
      issuerId,
      area,
      reason,
      timestamp: new Date().toISOString(),
      status: 'active'
    });

    const message: WebSocketMessage = {
      type: 'evacuation',
      data: order,
      timestamp: new Date().toISOString()
    };
    db.emit('websocket', message);

    return order;
  }

  completeEvacuation(orderId: string) {
    return db.update('evacuationOrders', orderId, {
      status: 'completed'
    });
  }

  getActiveEvacuationOrder() {
    return db.query('evacuationOrders', o => o.status === 'active')[0];
  }
}

export const safetyMonitoringService = new SafetyMonitoringService();
