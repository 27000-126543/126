import type {
  User, Project, Milestone, Task, Material, Equipment, Worker, Team,
  Sensor, SparePart, FloorPlan, MaintenanceWorkOrder, SafetyAlarm,
  SafetyIncident, EvacuationOrder, PurchaseRequest, AdjustmentRequest,
  Schedule, SensorReading
} from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

const now = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];
const formatDateTime = (d: Date) => d.toISOString();

export const mockUsers: User[] = [
  {
    id: uuidv4(),
    username: 'admin',
    name: '张经理',
    role: 'project_manager',
    passwordHash: 'admin123'
  },
  {
    id: uuidv4(),
    username: 'foreman1',
    name: '李工长',
    role: 'foreman',
    passwordHash: '123456'
  },
  {
    id: uuidv4(),
    username: 'safety1',
    name: '王安全员',
    role: 'safety_officer',
    passwordHash: '123456'
  },
  {
    id: uuidv4(),
    username: 'equipment1',
    name: '赵设备员',
    role: 'equipment_manager',
    passwordHash: '123456'
  },
  {
    id: uuidv4(),
    username: 'material1',
    name: '刘材料员',
    role: 'material_manager',
    passwordHash: '123456'
  },
  {
    id: uuidv4(),
    username: 'exec1',
    name: '陈总监',
    role: 'executive',
    passwordHash: '123456'
  }
];

export const mockProjects: Project[] = [
  {
    id: uuidv4(),
    projectNo: 'PROJ-2026-001',
    name: 'CBD商业中心建设项目',
    budget: 58000000,
    actualCost: 32500000,
    startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 3, 1)),
    endDate: formatDate(new Date(now.getFullYear() + 1, now.getMonth(), 15)),
    status: 'in_progress',
    description: '总建筑面积120000平方米的商业综合体，包含写字楼、商场、酒店三大部分',
    location: '市中心商务区A地块',
    createdAt: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 4, 1))
  },
  {
    id: uuidv4(),
    projectNo: 'PROJ-2026-002',
    name: '科技园标准厂房建设',
    budget: 25000000,
    actualCost: 8700000,
    startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 10)),
    endDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 8, 20)),
    status: 'in_progress',
    description: '三栋标准厂房及配套设施建设，总建筑面积45000平方米',
    location: '高新技术产业园B区',
    createdAt: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 2, 1))
  },
  {
    id: uuidv4(),
    projectNo: 'PROJ-2026-003',
    name: '地铁12号线站点工程',
    budget: 120000000,
    actualCost: 45000000,
    startDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 6, 1)),
    endDate: formatDate(new Date(now.getFullYear() + 2, now.getMonth() - 2, 1)),
    status: 'in_progress',
    description: '包含3个地铁站的土建工程及配套设施',
    location: '城市轨道交通12号线沿线',
    createdAt: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 7, 1))
  }
];

export const mockMilestones: Milestone[] = [
  {
    id: uuidv4(),
    projectId: mockProjects[0].id,
    name: '地基工程完成',
    plannedDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 15)),
    actualDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 20)),
    status: 'completed',
    description: '完成所有桩基施工及地基处理'
  },
  {
    id: uuidv4(),
    projectId: mockProjects[0].id,
    name: '地下室结构封顶',
    plannedDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 10)),
    actualDate: null,
    status: 'in_progress',
    description: '地下三层混凝土结构施工完成'
  },
  {
    id: uuidv4(),
    projectId: mockProjects[0].id,
    name: '主体结构50%',
    plannedDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 4, 1)),
    actualDate: null,
    status: 'pending',
    description: '地上15层结构施工完成'
  },
  {
    id: uuidv4(),
    projectId: mockProjects[0].id,
    name: '主体结构封顶',
    plannedDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 8, 15)),
    actualDate: null,
    status: 'pending',
    description: '地上35层结构全部施工完成'
  },
  {
    id: uuidv4(),
    projectId: mockProjects[1].id,
    name: '厂房1基础完成',
    plannedDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 25)),
    actualDate: null,
    status: 'in_progress',
    description: '1号厂房地基与基础工程完成'
  },
  {
    id: uuidv4(),
    projectId: mockProjects[1].id,
    name: '厂房钢结构安装',
    plannedDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 2, 10)),
    actualDate: null,
    status: 'pending',
    description: '三栋厂房钢结构主体安装完成'
  }
];

const project1Id = mockProjects[0].id;
const project2Id = mockProjects[1].id;

export const mockTasks: Task[] = [
  {
    id: uuidv4(),
    projectId: project1Id,
    name: '地下室负三层墙柱钢筋绑扎',
    description: '负三层剪力墙及框架柱钢筋绑扎施工',
    dependencies: [],
    skills: ['钢筋工', '焊工'],
    estimatedDuration: 480,
    status: 'completed',
    startDate: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 2, 1, 8, 0)),
    endDate: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 2, 3, 18, 0)),
    assignedTeamId: null,
    workArea: 'A区-地下三层',
    isHighAltitude: false,
    materials: [{ materialId: '', quantity: 12.5 }],
    equipment: [{ equipmentId: '', estimatedHours: 8 }]
  },
  {
    id: uuidv4(),
    projectId: project1Id,
    name: '地下室负三层模板安装',
    description: '负三层剪力墙及梁板模板安装',
    dependencies: [],
    skills: ['模板工'],
    estimatedDuration: 720,
    status: 'in_progress',
    startDate: formatDateTime(new Date(now.getFullYear(), now.getMonth(), 1, 8, 0)),
    endDate: null,
    assignedTeamId: null,
    workArea: 'A区-地下三层',
    isHighAltitude: false,
    materials: [{ materialId: '', quantity: 200 }],
    equipment: [{ equipmentId: '', estimatedHours: 16 }]
  },
  {
    id: uuidv4(),
    projectId: project1Id,
    name: '地下室负三层混凝土浇筑',
    description: '负三层墙柱梁板混凝土一次性浇筑',
    dependencies: [],
    skills: ['混凝土工', '泵车操作工'],
    estimatedDuration: 240,
    status: 'not_started',
    startDate: null,
    endDate: null,
    assignedTeamId: null,
    workArea: 'A区-地下三层',
    isHighAltitude: false,
    materials: [{ materialId: '', quantity: 850 }],
    equipment: [{ equipmentId: '', estimatedHours: 12 }]
  },
  {
    id: uuidv4(),
    projectId: project1Id,
    name: '地下二层脚手架搭设',
    description: '地下二层满堂脚手架及操作架搭设',
    dependencies: [],
    skills: ['架子工'],
    estimatedDuration: 360,
    status: 'not_started',
    startDate: null,
    endDate: null,
    assignedTeamId: null,
    workArea: 'A区-地下二层',
    isHighAltitude: true,
    materials: [{ materialId: '', quantity: 500 }],
    equipment: [{ equipmentId: '', estimatedHours: 4 }]
  },
  {
    id: uuidv4(),
    projectId: project1Id,
    name: '塔吊1号机标准节顶升',
    description: '1号塔吊顶升3个标准节至60米高度',
    dependencies: [],
    skills: ['塔吊司机', '起重工'],
    estimatedDuration: 480,
    status: 'pending',
    startDate: null,
    endDate: null,
    assignedTeamId: null,
    workArea: 'B区-塔吊1',
    isHighAltitude: true,
    materials: [],
    equipment: [{ equipmentId: '', estimatedHours: 8 }]
  },
  {
    id: uuidv4(),
    projectId: project2Id,
    name: '1号厂房基础承台浇筑',
    description: '1号厂房独立基础承台混凝土浇筑',
    dependencies: [],
    skills: ['混凝土工'],
    estimatedDuration: 180,
    status: 'in_progress',
    startDate: formatDateTime(new Date(now.getFullYear(), now.getMonth(), 5, 8, 0)),
    endDate: null,
    assignedTeamId: null,
    workArea: '1号厂房区',
    isHighAltitude: false,
    materials: [{ materialId: '', quantity: 320 }],
    equipment: [{ equipmentId: '', estimatedHours: 6 }]
  },
  {
    id: uuidv4(),
    projectId: project2Id,
    name: '钢结构预埋件安装',
    description: '厂房钢柱基础预埋件定位安装',
    dependencies: [],
    skills: ['焊工', '测量工'],
    estimatedDuration: 240,
    status: 'not_started',
    startDate: null,
    endDate: null,
    assignedTeamId: null,
    workArea: '1号厂房区',
    isHighAltitude: false,
    materials: [{ materialId: '', quantity: 48 }],
    equipment: []
  }
];

export const mockMaterials: Material[] = [
  {
    id: uuidv4(),
    code: 'MAT-001',
    name: 'HRB400E钢筋φ16',
    unit: '吨',
    totalStock: 185,
    reservedStock: 45,
    availableStock: 140,
    safetyStock: 50,
    unitPrice: 5200,
    supplier: '钢铁集团有限公司'
  },
  {
    id: uuidv4(),
    code: 'MAT-002',
    name: 'C30商品混凝土',
    unit: '立方米',
    totalStock: 2500,
    reservedStock: 850,
    availableStock: 1650,
    safetyStock: 300,
    unitPrice: 420,
    supplier: '建材混凝土有限公司'
  },
  {
    id: uuidv4(),
    code: 'MAT-003',
    name: '竹胶板18mm',
    unit: '张',
    totalStock: 3200,
    reservedStock: 1200,
    availableStock: 2000,
    safetyStock: 500,
    unitPrice: 145,
    supplier: '木业制品厂'
  },
  {
    id: uuidv4(),
    code: 'MAT-004',
    name: '脚手架钢管φ48',
    unit: '吨',
    totalStock: 85,
    reservedStock: 60,
    availableStock: 25,
    safetyStock: 30,
    unitPrice: 6800,
    supplier: '金属材料公司'
  },
  {
    id: uuidv4(),
    code: 'MAT-005',
    name: '42.5级硅酸盐水泥',
    unit: '吨',
    totalStock: 420,
    reservedStock: 180,
    availableStock: 240,
    safetyStock: 150,
    unitPrice: 680,
    supplier: '水泥厂'
  },
  {
    id: uuidv4(),
    code: 'MAT-006',
    name: '中砂',
    unit: '立方米',
    totalStock: 1200,
    reservedStock: 400,
    availableStock: 800,
    safetyStock: 200,
    unitPrice: 165,
    supplier: '砂石场'
  },
  {
    id: uuidv4(),
    code: 'MAT-007',
    name: '10-20mm碎石',
    unit: '立方米',
    totalStock: 950,
    reservedStock: 350,
    availableStock: 600,
    safetyStock: 180,
    unitPrice: 185,
    supplier: '砂石场'
  },
  {
    id: uuidv4(),
    code: 'MAT-008',
    name: '止水钢板3mm',
    unit: '米',
    totalStock: 850,
    reservedStock: 200,
    availableStock: 650,
    safetyStock: 100,
    unitPrice: 85,
    supplier: '五金建材公司'
  }
];

export const mockEquipment: Equipment[] = [
  {
    id: uuidv4(),
    code: 'EQ-001',
    name: '塔式起重机QTZ80',
    type: '起重设备',
    status: 'in_use',
    location: 'CBD项目A区',
    totalRuntime: 1280,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 15)),
    nextMaintenanceHours: 220,
    maintenanceThreshold: 250,
    specifications: { '最大起重量': '8吨', '最大臂长': '60米', '额定功率': '55kW' }
  },
  {
    id: uuidv4(),
    code: 'EQ-002',
    name: '塔式起重机QTZ63',
    type: '起重设备',
    status: 'available',
    location: 'CBD项目B区',
    totalRuntime: 960,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 10)),
    nextMaintenanceHours: 40,
    maintenanceThreshold: 250,
    specifications: { '最大起重量': '6吨', '最大臂长': '55米', '额定功率': '45kW' }
  },
  {
    id: uuidv4(),
    code: 'EQ-003',
    name: '混凝土泵车47米',
    type: '混凝土设备',
    status: 'in_use',
    location: 'CBD项目A区',
    totalRuntime: 520,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    nextMaintenanceHours: 80,
    maintenanceThreshold: 100,
    specifications: { '最大排量': '180方/小时', '最大高度': '47米', '额定功率': '320kW' }
  },
  {
    id: uuidv4(),
    code: 'EQ-004',
    name: '挖掘机PC220',
    type: '土石方设备',
    status: 'maintenance',
    location: '科技园项目',
    totalRuntime: 1850,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 3, 20)),
    nextMaintenanceHours: 0,
    maintenanceThreshold: 300,
    specifications: { '斗容': '1.1方', '功率': '125kW', '工作重量': '22吨' }
  },
  {
    id: uuidv4(),
    code: 'EQ-005',
    name: '装载机ZL50',
    type: '土石方设备',
    status: 'available',
    location: 'CBD项目',
    totalRuntime: 2100,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 5)),
    nextMaintenanceHours: 120,
    maintenanceThreshold: 200,
    specifications: { '额定载重': '5吨', '斗容': '3方', '额定功率': '162kW' }
  },
  {
    id: uuidv4(),
    code: 'EQ-006',
    name: '施工升降机SC200',
    type: '起重设备',
    status: 'in_use',
    location: 'CBD项目',
    totalRuntime: 680,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 5)),
    nextMaintenanceHours: 140,
    maintenanceThreshold: 200,
    specifications: { '额定载重量': '2吨', '提升速度': '36m/min', '额定功率': '2×15kW' }
  },
  {
    id: uuidv4(),
    code: 'EQ-007',
    name: '柴油发电机200kW',
    type: '动力设备',
    status: 'available',
    location: 'CBD项目',
    totalRuntime: 320,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 25)),
    nextMaintenanceHours: 80,
    maintenanceThreshold: 100,
    specifications: { '额定功率': '200kW', '额定电压': '400V', '燃油消耗': '210g/kW·h' }
  },
  {
    id: uuidv4(),
    code: 'EQ-008',
    name: '钢筋切断机GQ50',
    type: '钢筋加工设备',
    status: 'in_use',
    location: 'CBD项目钢筋加工场',
    totalRuntime: 480,
    lastMaintenanceDate: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 10)),
    nextMaintenanceHours: 70,
    maintenanceThreshold: 150,
    specifications: { '最大切断直径': '50mm', '切断效率': '32次/分', '额定功率': '5.5kW' }
  }
];

export const mockWorkers: Worker[] = [
  {
    id: uuidv4(),
    employeeNo: 'W001',
    name: '张建国',
    teamId: '',
    skills: ['钢筋工', '焊工'],
    certifications: ['焊工证', '高空作业证'],
    status: 'on_site',
    currentLocation: { x: 150, y: 200, area: 'A区-地下三层' },
    totalWorkHours: 1850
  },
  {
    id: uuidv4(),
    employeeNo: 'W002',
    name: '李明',
    teamId: '',
    skills: ['钢筋工'],
    certifications: [],
    status: 'on_site',
    currentLocation: { x: 160, y: 210, area: 'A区-地下三层' },
    totalWorkHours: 1620
  },
  {
    id: uuidv4(),
    employeeNo: 'W003',
    name: '王强',
    teamId: '',
    skills: ['模板工', '架子工'],
    certifications: ['高空作业证'],
    status: 'on_site',
    currentLocation: { x: 180, y: 190, area: 'A区-地下三层' },
    totalWorkHours: 2100
  },
  {
    id: uuidv4(),
    employeeNo: 'W004',
    name: '赵伟',
    teamId: '',
    skills: ['混凝土工', '泵车操作工'],
    certifications: ['泵车操作证'],
    status: 'available',
    currentLocation: null,
    totalWorkHours: 1450
  },
  {
    id: uuidv4(),
    employeeNo: 'W005',
    name: '刘刚',
    teamId: '',
    skills: ['架子工'],
    certifications: ['高空作业证'],
    status: 'on_site',
    currentLocation: { x: 200, y: 250, area: 'A区-地下二层' },
    totalWorkHours: 980
  },
  {
    id: uuidv4(),
    employeeNo: 'W006',
    name: '陈军',
    teamId: '',
    skills: ['塔吊司机', '起重工'],
    certifications: ['塔吊司机证', '起重作业证'],
    status: 'on_site',
    currentLocation: { x: 300, y: 150, area: 'B区-塔吊1' },
    totalWorkHours: 1280
  },
  {
    id: uuidv4(),
    employeeNo: 'W007',
    name: '周涛',
    teamId: '',
    skills: ['焊工', '测量工'],
    certifications: ['焊工证', '测量员证'],
    status: 'on_site',
    currentLocation: { x: 120, y: 220, area: '1号厂房区' },
    totalWorkHours: 1120
  },
  {
    id: uuidv4(),
    employeeNo: 'W008',
    name: '吴磊',
    teamId: '',
    skills: ['混凝土工'],
    certifications: [],
    status: 'on_site',
    currentLocation: { x: 140, y: 240, area: '1号厂房区' },
    totalWorkHours: 890
  },
  {
    id: uuidv4(),
    employeeNo: 'W009',
    name: '郑华',
    teamId: '',
    skills: ['电工'],
    certifications: ['电工证', '高空作业证'],
    status: 'available',
    currentLocation: null,
    totalWorkHours: 1560
  },
  {
    id: uuidv4(),
    employeeNo: 'W010',
    name: '孙明',
    teamId: '',
    skills: ['水暖工'],
    certifications: [],
    status: 'leave',
    currentLocation: null,
    totalWorkHours: 1340
  },
  {
    id: uuidv4(),
    employeeNo: 'W011',
    name: '马超',
    teamId: '',
    skills: ['挖掘机司机'],
    certifications: ['挖掘机操作证'],
    status: 'on_site',
    currentLocation: { x: 80, y: 180, area: '科技园项目' },
    totalWorkHours: 1780
  },
  {
    id: uuidv4(),
    employeeNo: 'W012',
    name: '朱峰',
    teamId: '',
    skills: ['装载机司机'],
    certifications: ['装载机操作证'],
    status: 'on_site',
    currentLocation: { x: 90, y: 160, area: 'CBD项目' },
    totalWorkHours: 1420
  }
];

export const mockTeams: Team[] = [
  {
    id: uuidv4(),
    name: '钢筋一班',
    teamLeaderId: mockWorkers[0].id,
    members: [mockWorkers[0].id, mockWorkers[1].id],
    type: '结构施工'
  },
  {
    id: uuidv4(),
    name: '模板一班',
    teamLeaderId: mockWorkers[2].id,
    members: [mockWorkers[2].id],
    type: '结构施工'
  },
  {
    id: uuidv4(),
    name: '混凝土一班',
    teamLeaderId: mockWorkers[3].id,
    members: [mockWorkers[3].id, mockWorkers[7].id],
    type: '结构施工'
  },
  {
    id: uuidv4(),
    name: '架子一班',
    teamLeaderId: mockWorkers[4].id,
    members: [mockWorkers[4].id],
    type: '脚手架'
  },
  {
    id: uuidv4(),
    name: '起重班',
    teamLeaderId: mockWorkers[5].id,
    members: [mockWorkers[5].id],
    type: '起重作业'
  },
  {
    id: uuidv4(),
    name: '机械班',
    teamLeaderId: mockWorkers[10].id,
    members: [mockWorkers[10].id, mockWorkers[11].id],
    type: '机械设备'
  }
];

mockWorkers[0].teamId = mockTeams[0].id;
mockWorkers[1].teamId = mockTeams[0].id;
mockWorkers[2].teamId = mockTeams[1].id;
mockWorkers[3].teamId = mockTeams[2].id;
mockWorkers[4].teamId = mockTeams[3].id;
mockWorkers[5].teamId = mockTeams[4].id;
mockWorkers[7].teamId = mockTeams[2].id;
mockWorkers[10].teamId = mockTeams[5].id;
mockWorkers[11].teamId = mockTeams[5].id;

mockTasks[0].assignedTeamId = mockTeams[0].id;
mockTasks[1].assignedTeamId = mockTeams[1].id;
mockTasks[2].assignedTeamId = mockTeams[2].id;
mockTasks[3].assignedTeamId = mockTeams[3].id;
mockTasks[4].assignedTeamId = mockTeams[4].id;
mockTasks[5].assignedTeamId = mockTeams[2].id;
mockTasks[6].assignedTeamId = mockTeams[4].id;

export const mockSensors: Sensor[] = [
  {
    id: uuidv4(),
    code: 'S-NOISE-001',
    type: 'noise',
    location: 'CBD项目A区边界',
    x: 50,
    y: 100,
    status: 'online',
    threshold: { warning: 70, critical: 85 }
  },
  {
    id: uuidv4(),
    code: 'S-NOISE-002',
    type: 'noise',
    location: 'CBD项目B区边界',
    x: 350,
    y: 100,
    status: 'online',
    threshold: { warning: 70, critical: 85 }
  },
  {
    id: uuidv4(),
    code: 'S-DUST-001',
    type: 'dust',
    location: 'CBD项目主出入口',
    x: 200,
    y: 50,
    status: 'online',
    threshold: { warning: 150, critical: 250 }
  },
  {
    id: uuidv4(),
    code: 'S-DUST-002',
    type: 'dust',
    location: '科技园项目施工现场',
    x: 100,
    y: 300,
    status: 'online',
    threshold: { warning: 150, critical: 250 }
  },
  {
    id: uuidv4(),
    code: 'S-TOWER-001',
    type: 'tower_crane',
    location: '1号塔吊',
    x: 150,
    y: 180,
    status: 'online',
    threshold: { warning: 3, critical: 5 }
  },
  {
    id: uuidv4(),
    code: 'S-TOWER-002',
    type: 'tower_crane',
    location: '2号塔吊',
    x: 250,
    y: 180,
    status: 'online',
    threshold: { warning: 3, critical: 5 }
  },
  {
    id: uuidv4(),
    code: 'S-TEMP-001',
    type: 'temperature',
    location: 'CBD项目生活区',
    x: 300,
    y: 280,
    status: 'online',
    threshold: { warning: 35, critical: 40 }
  },
  {
    id: uuidv4(),
    code: 'S-HUMID-001',
    type: 'humidity',
    location: 'CBD项目施工现场',
    x: 180,
    y: 150,
    status: 'online',
    threshold: { warning: 90, critical: 95 }
  }
];

export const mockSpareParts: SparePart[] = [
  {
    id: uuidv4(),
    name: '塔吊起升电机',
    code: 'SP-001',
    stock: 2,
    safetyStock: 2,
    unitPrice: 8500
  },
  {
    id: uuidv4(),
    name: '液压油滤芯',
    code: 'SP-002',
    stock: 15,
    safetyStock: 10,
    unitPrice: 280
  },
  {
    id: uuidv4(),
    name: '挖掘机斗齿',
    code: 'SP-003',
    stock: 8,
    safetyStock: 6,
    unitPrice: 450
  },
  {
    id: uuidv4(),
    name: '泵车输送缸密封圈',
    code: 'SP-004',
    stock: 6,
    safetyStock: 4,
    unitPrice: 1200
  },
  {
    id: uuidv4(),
    name: '发电机空气滤清器',
    code: 'SP-005',
    stock: 10,
    safetyStock: 5,
    unitPrice: 320
  },
  {
    id: uuidv4(),
    name: '变幅钢丝绳',
    code: 'SP-006',
    stock: 3,
    safetyStock: 2,
    unitPrice: 2800
  }
];

export const mockFloorPlans: FloorPlan[] = [
  {
    id: uuidv4(),
    projectId: project1Id,
    name: 'CBD项目施工平面图',
    width: 800,
    height: 600,
    areas: [
      {
        id: uuidv4(),
        name: 'A区-地下三层',
        type: '施工区',
        bounds: { x: 100, y: 150, width: 200, height: 150 },
        status: 'active'
      },
      {
        id: uuidv4(),
        name: 'B区-地下二层',
        type: '施工区',
        bounds: { x: 350, y: 150, width: 200, height: 150 },
        status: 'active'
      },
      {
        id: uuidv4(),
        name: 'C区-材料堆场',
        type: '堆场区',
        bounds: { x: 100, y: 350, width: 180, height: 120 },
        status: 'active'
      },
      {
        id: uuidv4(),
        name: 'D区-钢筋加工场',
        type: '加工区',
        bounds: { x: 320, y: 350, width: 150, height: 120 },
        status: 'active'
      },
      {
        id: uuidv4(),
        name: 'E区-办公生活区',
        type: '办公区',
        bounds: { x: 520, y: 100, width: 180, height: 180 },
        status: 'idle'
      },
      {
        id: uuidv4(),
        name: 'F区-塔吊作业区',
        type: '危险区',
        bounds: { x: 100, y: 50, width: 350, height: 80 },
        status: 'dangerous'
      }
    ]
  },
  {
    id: uuidv4(),
    projectId: project2Id,
    name: '科技园项目施工平面图',
    width: 600,
    height: 500,
    areas: [
      {
        id: uuidv4(),
        name: '1号厂房区',
        type: '施工区',
        bounds: { x: 50, y: 80, width: 200, height: 180 },
        status: 'active'
      },
      {
        id: uuidv4(),
        name: '2号厂房区',
        type: '施工区',
        bounds: { x: 300, y: 80, width: 200, height: 180 },
        status: 'idle'
      },
      {
        id: uuidv4(),
        name: '3号厂房区',
        type: '施工区',
        bounds: { x: 50, y: 300, width: 200, height: 140 },
        status: 'idle'
      },
      {
        id: uuidv4(),
        name: '材料加工区',
        type: '加工区',
        bounds: { x: 300, y: 300, width: 200, height: 140 },
        status: 'active'
      }
    ]
  }
];

export const mockMaintenanceWorkOrders: MaintenanceWorkOrder[] = [
  {
    id: uuidv4(),
    equipmentId: mockEquipment[3].id,
    type: 'corrective',
    description: '挖掘机液压系统故障，需要更换液压泵密封组件',
    status: 'in_progress',
    assignedTeamId: mockTeams[5].id,
    partsUsed: [{ sparePartId: mockSpareParts[1].id, quantity: 2 }],
    scheduledDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 6)),
    completedDate: null
  },
  {
    id: uuidv4(),
    equipmentId: mockEquipment[1].id,
    type: 'preventive',
    description: '2号塔吊例行保养，检查钢丝绳、制动器、限位装置',
    status: 'pending',
    assignedTeamId: null,
    partsUsed: [],
    scheduledDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 10)),
    completedDate: null
  },
  {
    id: uuidv4(),
    equipmentId: mockEquipment[2].id,
    type: 'preventive',
    description: '泵车50小时例行保养，更换液压油滤芯',
    status: 'completed',
    assignedTeamId: mockTeams[5].id,
    partsUsed: [{ sparePartId: mockSpareParts[1].id, quantity: 1 }],
    scheduledDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    completedDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }
];

export const mockSensorReadings: SensorReading[] = [];
for (let i = 0; i < 50; i++) {
  for (const sensor of mockSensors) {
    let baseValue = 0;
    switch (sensor.type) {
      case 'noise': baseValue = 55 + Math.random() * 30; break;
      case 'dust': baseValue = 80 + Math.random() * 120; break;
      case 'tower_crane': baseValue = 1 + Math.random() * 3; break;
      case 'temperature': baseValue = 25 + Math.random() * 15; break;
      case 'humidity': baseValue = 40 + Math.random() * 50; break;
    }
    const readingTime = new Date(now.getTime() - i * 5 * 60 * 1000);
    mockSensorReadings.push({
      id: uuidv4(),
      sensorId: sensor.id,
      value: parseFloat(baseValue.toFixed(1)),
      timestamp: formatDateTime(readingTime),
      level: baseValue >= sensor.threshold.critical ? 'critical' : baseValue >= sensor.threshold.warning ? 'warning' : 'normal'
    });
  }
}

const criticalReading = mockSensorReadings.find(r => r.sensorId === mockSensors[0].id);
if (criticalReading) {
  criticalReading.value = 88;
  criticalReading.level = 'critical';
}

export const mockSafetyAlarms: SafetyAlarm[] = [
  {
    id: uuidv4(),
    sensorId: mockSensors[0].id,
    type: 'noise',
    level: 'critical',
    message: 'A区边界噪音超过85dB，请立即采取降噪措施',
    timestamp: formatDateTime(new Date(now.getTime() - 10 * 60000)),
    acknowledged: false,
    acknowledgedBy: null,
    acknowledgedAt: null
  },
  {
    id: uuidv4(),
    sensorId: mockSensors[2].id,
    type: 'dust',
    level: 'warning',
    message: '主出入口PM10浓度达到180μg/m³，建议开启喷淋降尘',
    timestamp: formatDateTime(new Date(now.getTime() - 45 * 60000)),
    acknowledged: true,
    acknowledgedBy: mockUsers[2].id,
    acknowledgedAt: formatDateTime(new Date(now.getTime() - 30 * 60000))
  },
  {
    id: uuidv4(),
    sensorId: mockSensors[4].id,
    type: 'tower_crane',
    level: 'warning',
    message: '1号塔吊倾斜度达到3.2度，请密切关注',
    timestamp: formatDateTime(new Date(now.getTime() - 2 * 60 * 60000)),
    acknowledged: true,
    acknowledgedBy: mockUsers[2].id,
    acknowledgedAt: formatDateTime(new Date(now.getTime() - 100 * 60000))
  }
];

export const mockSafetyIncidents: SafetyIncident[] = [
  {
    id: uuidv4(),
    date: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 15)),
    type: 'near_miss',
    severity: 'minor',
    description: '高处坠物，未造成人员伤亡，已加强临边防护',
    location: 'CBD项目A区',
    reportedBy: mockUsers[2].id
  },
  {
    id: uuidv4(),
    date: formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 8)),
    type: 'injury',
    severity: 'minor',
    description: '工人手指被钢筋划伤，已送医处理，恢复良好',
    location: 'CBD项目钢筋加工场',
    reportedBy: mockUsers[2].id
  }
];

export const mockEvacuationOrders: EvacuationOrder[] = [];

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: uuidv4(),
    materialId: mockMaterials[3].id,
    quantity: 100,
    reason: '脚手架钢管库存已低于安全库存，即将开始地上结构施工用量大',
    status: 'pending',
    requestedBy: mockUsers[4].id,
    approvedBy: null,
    createdAt: formatDateTime(new Date(now.getTime() - 2 * 60 * 60000))
  },
  {
    id: uuidv4(),
    materialId: mockMaterials[0].id,
    quantity: 200,
    reason: '主体结构施工进入关键阶段，需提前备货',
    status: 'approved',
    requestedBy: mockUsers[4].id,
    approvedBy: mockUsers[0].id,
    createdAt: formatDateTime(new Date(now.getTime() - 24 * 60 * 60000))
  },
  {
    id: uuidv4(),
    materialId: mockMaterials[2].id,
    quantity: 5000,
    reason: '地下室模板工程需要大量模板',
    status: 'ordered',
    requestedBy: mockUsers[4].id,
    approvedBy: mockUsers[0].id,
    createdAt: formatDateTime(new Date(now.getTime() - 3 * 24 * 60 * 60000))
  }
];

export const mockAdjustmentRequests: AdjustmentRequest[] = [
  {
    id: uuidv4(),
    taskId: mockTasks[2].id,
    requesterId: mockUsers[1].id,
    reason: '预计明天有中雨，建议混凝土浇筑改到后天进行',
    suggestedChange: '将负三层混凝土浇筑时间从6月7日调整到6月9日',
    status: 'pending',
    approverId: null,
    createdAt: formatDateTime(new Date(now.getTime() - 30 * 60000))
  },
  {
    id: uuidv4(),
    taskId: mockTasks[4].id,
    requesterId: mockUsers[1].id,
    reason: '起重班组人员临时不足，请求延后1天进行塔吊顶升',
    suggestedChange: '塔吊顶升作业延后1天',
    status: 'approved',
    approverId: mockUsers[0].id,
    createdAt: formatDateTime(new Date(now.getTime() - 2 * 24 * 60 * 60000))
  }
];

export const mockSchedules: Schedule[] = [
  {
    id: uuidv4(),
    projectId: project1Id,
    date: formatDate(now),
    tasks: [
      {
        taskId: mockTasks[1].id,
        startTime: formatDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0)),
        endTime: formatDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0)),
        assignedWorkers: [mockWorkers[2].id],
        assignedEquipment: []
      },
      {
        taskId: mockTasks[5].id,
        startTime: formatDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0)),
        endTime: formatDateTime(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0)),
        assignedWorkers: [mockWorkers[3].id, mockWorkers[7].id],
        assignedEquipment: [mockEquipment[2].id]
      }
    ],
    status: 'published',
    conflicts: []
  }
];

export const mockWorkHours = [
  {
    id: uuidv4(),
    workerId: mockWorkers[0].id,
    taskId: mockTasks[0].id,
    date: formatDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
    hours: 10,
    overtime: 2,
    recordedBy: mockUsers[1].id
  },
  {
    id: uuidv4(),
    workerId: mockWorkers[2].id,
    taskId: mockTasks[1].id,
    date: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    hours: 9,
    overtime: 1,
    recordedBy: mockUsers[1].id
  },
  {
    id: uuidv4(),
    workerId: mockWorkers[3].id,
    taskId: mockTasks[5].id,
    date: formatDate(new Date(now.getFullYear(), now.getMonth(), 5)),
    hours: 8,
    overtime: 0,
    recordedBy: mockUsers[1].id
  }
];

export const mockEquipmentUsage = [
  {
    id: uuidv4(),
    equipmentId: mockEquipment[0].id,
    taskId: mockTasks[0].id,
    startTime: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 2, 1, 8, 0)),
    endTime: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 2, 3, 18, 0)),
    duration: 24,
    operatorId: mockWorkers[5].id
  },
  {
    id: uuidv4(),
    equipmentId: mockEquipment[2].id,
    taskId: mockTasks[5].id,
    startTime: formatDateTime(new Date(now.getFullYear(), now.getMonth(), 5, 8, 0)),
    endTime: null,
    duration: 0,
    operatorId: mockWorkers[3].id
  }
];

export const mockMaterialConsumptions = [
  {
    id: uuidv4(),
    taskId: mockTasks[0].id,
    materialId: mockMaterials[0].id,
    quantity: 12.5,
    recordedBy: mockUsers[4].id,
    recordedAt: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 2, 3, 19, 0))
  },
  {
    id: uuidv4(),
    taskId: mockTasks[0].id,
    materialId: mockMaterials[1].id,
    quantity: 85,
    recordedBy: mockUsers[4].id,
    recordedAt: formatDateTime(new Date(now.getFullYear(), now.getMonth() - 2, 3, 19, 0))
  }
];
