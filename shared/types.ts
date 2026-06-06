export type UserRole = 'project_manager' | 'foreman' | 'safety_officer' | 'equipment_manager' | 'material_manager' | 'executive';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'suspended';

export interface Project {
  id: string;
  projectNo: string;
  name: string;
  budget: number;
  actualCost: number;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  description: string;
  location: string;
  createdAt: string;
}

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  plannedDate: string;
  actualDate: string | null;
  status: MilestoneStatus;
  description: string;
}

export type TaskStatus = 'pending' | 'not_started' | 'in_progress' | 'completed' | 'rework';

export interface TaskMaterial {
  materialId: string;
  quantity: number;
}

export interface TaskEquipment {
  equipmentId: string;
  estimatedHours: number;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description: string;
  dependencies: string[];
  skills: string[];
  estimatedDuration: number;
  status: TaskStatus;
  startDate: string | null;
  endDate: string | null;
  assignedTeamId: string | null;
  workArea: string;
  isHighAltitude: boolean;
  materials: TaskMaterial[];
  equipment: TaskEquipment[];
}

export type ScheduleStatus = 'draft' | 'confirmed' | 'published';

export interface ScheduleConflict {
  type: 'workstation' | 'equipment' | 'worker' | 'safety';
  description: string;
  severity: 'warning' | 'critical';
  taskIds: string[];
}

export interface ScheduledTask {
  taskId: string;
  startTime: string;
  endTime: string;
  assignedWorkers: string[];
  assignedEquipment: string[];
}

export interface Schedule {
  id: string;
  projectId: string;
  date: string;
  tasks: ScheduledTask[];
  status: ScheduleStatus;
  conflicts: ScheduleConflict[];
}

export type AdjustmentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdjustmentRequest {
  id: string;
  taskId: string;
  requesterId: string;
  reason: string;
  suggestedChange: string;
  status: AdjustmentRequestStatus;
  approverId: string | null;
  createdAt: string;
}

export interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  safetyStock: number;
  unitPrice: number;
  supplier: string;
}

export interface MaterialConsumption {
  id: string;
  taskId: string;
  materialId: string;
  quantity: number;
  recordedBy: string;
  recordedAt: string;
}

export type PurchaseRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'ordered' | 'received';

export interface PurchaseRequest {
  id: string;
  materialId: string;
  quantity: number;
  reason: string;
  status: PurchaseRequestStatus;
  requestedBy: string;
  approvedBy: string | null;
  createdAt: string;
}

export type SensorType = 'noise' | 'dust' | 'tower_crane' | 'temperature' | 'humidity';
export type SensorStatus = 'online' | 'offline' | 'fault';
export type ReadingLevel = 'normal' | 'warning' | 'critical';

export interface SensorThreshold {
  warning: number;
  critical: number;
}

export interface Sensor {
  id: string;
  code: string;
  type: SensorType;
  location: string;
  x: number;
  y: number;
  status: SensorStatus;
  threshold: SensorThreshold;
}

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  timestamp: string;
  level: ReadingLevel;
}

export type AlarmLevel = 'warning' | 'critical';

export interface SafetyAlarm {
  id: string;
  sensorId: string;
  type: string;
  level: AlarmLevel;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

export type EvacuationStatus = 'active' | 'completed' | 'cancelled';

export interface EvacuationOrder {
  id: string;
  issuerId: string;
  area: string;
  reason: string;
  timestamp: string;
  status: EvacuationStatus;
}

export type IncidentType = 'injury' | 'near_miss' | 'property_damage' | 'environmental';
export type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'fatal';

export interface SafetyIncident {
  id: string;
  date: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  reportedBy: string;
}

export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'fault' | 'retired';

export interface Equipment {
  id: string;
  code: string;
  name: string;
  type: string;
  status: EquipmentStatus;
  location: string;
  totalRuntime: number;
  lastMaintenanceDate: string;
  nextMaintenanceHours: number;
  maintenanceThreshold: number;
  specifications: Record<string, string>;
}

export interface EquipmentUsage {
  id: string;
  equipmentId: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  operatorId: string;
}

export type WorkOrderType = 'preventive' | 'corrective' | 'emergency';
export type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed';

export interface MaintenancePart {
  sparePartId: string;
  quantity: number;
}

export interface MaintenanceWorkOrder {
  id: string;
  equipmentId: string;
  type: WorkOrderType;
  description: string;
  status: WorkOrderStatus;
  assignedTeamId: string | null;
  partsUsed: MaintenancePart[];
  scheduledDate: string;
  completedDate: string | null;
}

export interface SparePart {
  id: string;
  name: string;
  code: string;
  stock: number;
  safetyStock: number;
  unitPrice: number;
}

export type WorkerStatus = 'available' | 'on_site' | 'leave' | 'off_work';

export interface WorkerLocation {
  x: number;
  y: number;
  area: string;
}

export interface Worker {
  id: string;
  employeeNo: string;
  name: string;
  teamId: string;
  skills: string[];
  certifications: string[];
  status: WorkerStatus;
  currentLocation: WorkerLocation | null;
  totalWorkHours: number;
}

export interface Team {
  id: string;
  name: string;
  teamLeaderId: string;
  members: string[];
  type: string;
}

export interface WorkHours {
  id: string;
  workerId: string;
  taskId: string;
  date: string;
  hours: number;
  overtime: number;
  recordedBy: string;
}

export interface FloorArea {
  id: string;
  name: string;
  type: string;
  bounds: { x: number; y: number; width: number; height: number };
  status: 'active' | 'idle' | 'dangerous';
}

export interface FloorPlan {
  id: string;
  projectId: string;
  name: string;
  width: number;
  height: number;
  areas: FloorArea[];
}

export interface HeatmapData {
  areaId: string;
  workerCount: number;
  equipmentCount: number;
  intensity: number;
  timestamp: string;
}

export interface LocationUpdate {
  entityType: 'worker' | 'equipment';
  entityId: string;
  x: number;
  y: number;
  area: string;
  timestamp: string;
}

export interface StatisticsQuery {
  projectId?: string;
  teamId?: string;
  startDate: string;
  endDate: string;
  groupBy: 'project' | 'team' | 'week' | 'month';
}

export interface ProgressStat {
  projectId: string;
  projectName: string;
  plannedProgress: number;
  actualProgress: number;
  completionRate: number;
  delayedTasks: number;
  completedTasks: number;
  totalTasks: number;
}

export interface MaterialStat {
  materialId: string;
  materialName: string;
  plannedUsage: number;
  actualUsage: number;
  overConsumptionRate: number;
  unitPrice: number;
  costVariance: number;
}

export interface SafetyStat {
  period: string;
  totalAlarms: number;
  criticalAlarms: number;
  incidents: number;
  injuryIncidents: number;
  nearMisses: number;
  evacuationCount: number;
}

export interface WorkHoursStat {
  period: string;
  teamId: string;
  teamName: string;
  totalHours: number;
  overtimeHours: number;
  workerCount: number;
}

export interface EquipmentStat {
  equipmentId: string;
  equipmentName: string;
  totalRuntime: number;
  utilizationRate: number;
  maintenanceCount: number;
  downtime: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface WebSocketMessage {
  type: 'sensor_reading' | 'alarm' | 'evacuation' | 'task_update' | 'location_update' | 'notification';
  data: unknown;
  timestamp: string;
}
