import * as mockData from './mockData.js';
import type {
  User, Project, Milestone, Task, Material, MaterialConsumption,
  Equipment, EquipmentUsage, Worker, Team, WorkHours, Sensor,
  SensorReading, SafetyAlarm, SafetyIncident, EvacuationOrder,
  SparePart, MaintenanceWorkOrder, FloorPlan, PurchaseRequest,
  AdjustmentRequest, Schedule, WebSocketMessage
} from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';
import EventEmitter from 'events';

export class Database extends EventEmitter {
  private data: {
    users: User[];
    projects: Project[];
    milestones: Milestone[];
    tasks: Task[];
    materials: Material[];
    materialConsumptions: MaterialConsumption[];
    equipment: Equipment[];
    equipmentUsage: EquipmentUsage[];
    workers: Worker[];
    teams: Team[];
    workHours: WorkHours[];
    sensors: Sensor[];
    sensorReadings: SensorReading[];
    safetyAlarms: SafetyAlarm[];
    safetyIncidents: SafetyIncident[];
    evacuationOrders: EvacuationOrder[];
    spareParts: SparePart[];
    maintenanceWorkOrders: MaintenanceWorkOrder[];
    floorPlans: FloorPlan[];
    purchaseRequests: PurchaseRequest[];
    adjustmentRequests: AdjustmentRequest[];
    schedules: Schedule[];
  };

  constructor() {
    super();
    this.data = {
      users: [...mockData.mockUsers],
      projects: [...mockData.mockProjects],
      milestones: [...mockData.mockMilestones],
      tasks: [...mockData.mockTasks],
      materials: [...mockData.mockMaterials],
      materialConsumptions: [...mockData.mockMaterialConsumptions],
      equipment: [...mockData.mockEquipment],
      equipmentUsage: [...mockData.mockEquipmentUsage],
      workers: [...mockData.mockWorkers],
      teams: [...mockData.mockTeams],
      workHours: [...mockData.mockWorkHours],
      sensors: [...mockData.mockSensors],
      sensorReadings: [...mockData.mockSensorReadings],
      safetyAlarms: [...mockData.mockSafetyAlarms],
      safetyIncidents: [...mockData.mockSafetyIncidents],
      evacuationOrders: [...mockData.mockEvacuationOrders],
      spareParts: [...mockData.mockSpareParts],
      maintenanceWorkOrders: [...mockData.mockMaintenanceWorkOrders],
      floorPlans: [...mockData.mockFloorPlans],
      purchaseRequests: [...mockData.mockPurchaseRequests],
      adjustmentRequests: [...mockData.mockAdjustmentRequests],
      schedules: [...mockData.mockSchedules]
    };
  }

  private emitChange<T>(collection: string, action: string, item: T) {
    this.emit('change', { collection, action, item });
    const message: WebSocketMessage = {
      type: collection as WebSocketMessage['type'],
      data: item,
      timestamp: new Date().toISOString()
    };
    this.emit('websocket', message);
  }

  private findById<T extends { id: string }>(collection: T[], id: string): T | undefined {
    return collection.find(item => item.id === id);
  }

  getAll<T extends keyof typeof this.data>(collection: T): typeof this.data[T] {
    return this.data[collection] as typeof this.data[T];
  }

  getById<T extends keyof typeof this.data>(collection: T, id: string): typeof this.data[T][number] | undefined {
    return this.findById(this.data[collection] as Array<{ id: string }>, id) as typeof this.data[T][number] | undefined;
  }

  create<T extends keyof typeof this.data>(
    collection: T,
    item: Omit<typeof this.data[T][number], 'id'>
  ): typeof this.data[T][number] {
    const newItem = { ...item, id: uuidv4() } as typeof this.data[T][number];
    (this.data[collection] as Array<typeof this.data[T][number]>).push(newItem);
    this.emitChange(collection, 'create', newItem);
    return newItem;
  }

  update<T extends keyof typeof this.data>(
    collection: T,
    id: string,
    updates: Partial<typeof this.data[T][number]>
  ): typeof this.data[T][number] | undefined {
    const col = this.data[collection] as Array<{ id: string }>;
    const index = col.findIndex(item => item.id === id);
    if (index === -1) return undefined;
    const updatedItem = { ...col[index], ...updates } as typeof this.data[T][number];
    col[index] = updatedItem;
    this.emitChange(collection, 'update', updatedItem);
    return updatedItem;
  }

  delete<T extends keyof typeof this.data>(collection: T, id: string): boolean {
    const col = this.data[collection] as Array<{ id: string }>;
    const index = col.findIndex(item => item.id === id);
    if (index === -1) return false;
    col.splice(index, 1);
    this.emitChange(collection, 'delete', { id });
    return true;
  }

  query<T extends keyof typeof this.data>(
    collection: T,
    predicate: (item: typeof this.data[T][number]) => boolean
  ): typeof this.data[T] {
    return (this.data[collection] as Array<typeof this.data[T][number]>).filter(predicate) as typeof this.data[T];
  }

  authenticate(username: string, password: string): User | null {
    const user = this.data.users.find(u => u.username === username);
    if (user && user.passwordHash === password) {
      return user;
    }
    return null;
  }
}

export const db = new Database();
