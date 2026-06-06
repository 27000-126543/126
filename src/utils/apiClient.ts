import type { ApiResponse } from '../../shared/types.js';

const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || '请求失败');
  }

  return data.data as T;
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { username, password }),
};

export const projectApi = {
  getProjects: () => apiClient.get('/projects'),
  getProject: (id: string) => apiClient.get(`/projects/${id}`),
  createProject: (data: unknown) => apiClient.post('/projects', data),
  updateProject: (id: string, data: unknown) => apiClient.put(`/projects/${id}`, data),
  deleteProject: (id: string) => apiClient.delete(`/projects/${id}`),
  getMilestones: (projectId: string) => apiClient.get(`/projects/${projectId}/milestones`),
  createMilestone: (projectId: string, data: unknown) => apiClient.post(`/projects/${projectId}/milestones`, data),
  updateMilestone: (projectId: string, milestoneId: string, data: unknown) =>
    apiClient.put(`/projects/${projectId}/milestones/${milestoneId}`, data),
  deleteMilestone: (projectId: string, milestoneId: string) =>
    apiClient.delete(`/projects/${projectId}/milestones/${milestoneId}`),
};

export const taskApi = {
  getTasks: (params?: { projectId?: string; status?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/tasks${query}`);
  },
  getTask: (id: string) => apiClient.get(`/tasks/${id}`),
  createTask: (data: unknown) => apiClient.post('/tasks', data),
  updateTask: (id: string, data: unknown) => apiClient.put(`/tasks/${id}`, data),
  updateTaskStatus: (id: string, status: string) =>
    apiClient.patch(`/tasks/${id}/status`, { status }),
  createAdjustment: (taskId: string, data: unknown) =>
    apiClient.post(`/tasks/${taskId}/adjustments`, data),
  getAdjustments: () => apiClient.get('/tasks/adjustments'),
  approveAdjustment: (id: string) => apiClient.put(`/tasks/adjustments/${id}/approve`),
  rejectAdjustment: (id: string) => apiClient.put(`/tasks/adjustments/${id}/reject`),
};

export const schedulingApi = {
  generateSchedule: (projectId: string, date: string) =>
    apiClient.post('/scheduling/generate', { projectId, date }),
  getSchedule: (date: string) => apiClient.get(`/scheduling/${date}`),
  confirmSchedule: (id: string) => apiClient.put(`/scheduling/${id}/confirm`),
  publishSchedule: (id: string) => apiClient.put(`/scheduling/${id}/publish`),
};

export const materialApi = {
  getMaterials: () => apiClient.get('/materials'),
  getMaterial: (id: string) => apiClient.get(`/materials/${id}`),
  createMaterial: (data: unknown) => apiClient.post('/materials', data),
  updateMaterial: (id: string, data: unknown) => apiClient.put(`/materials/${id}`, data),
  getConsumptions: (id: string) => apiClient.get(`/materials/${id}/consumptions`),
  consumeMaterial: (data: unknown) => apiClient.post('/materials/consume', data),
  getAlerts: () => apiClient.get('/materials/alerts'),
  getPurchaseRequests: () => apiClient.get('/materials/purchase-requests'),
  createPurchaseRequest: (data: unknown) => apiClient.post('/materials/purchase-requests', data),
  approvePurchaseRequest: (id: string) => apiClient.put(`/materials/purchase-requests/${id}/approve`),
};

export const safetyApi = {
  getSensors: () => apiClient.get('/sensors'),
  getSensorReadings: (id: string) => apiClient.get(`/sensors/${id}/readings`),
  submitSensorReading: (data: unknown) => apiClient.post('/sensors/readings', data),
  getAlarms: () => apiClient.get('/safety/alarms'),
  acknowledgeAlarm: (id: string) => apiClient.post(`/safety/alarms/${id}/acknowledge`),
  issueEvacuation: (data: unknown) => apiClient.post('/safety/evacuation', data),
  getCurrentEvacuation: () => apiClient.get('/safety/evacuation/current'),
  completeEvacuation: (id: string) => apiClient.post(`/safety/evacuation/${id}/complete`),
  getIncidents: () => apiClient.get('/safety/incidents'),
  createIncident: (data: unknown) => apiClient.post('/safety/incidents', data),
};

export const equipmentApi = {
  getEquipment: (params?: { status?: string; type?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/equipment${query}`);
  },
  createEquipment: (data: unknown) => apiClient.post('/equipment', data),
  updateEquipment: (id: string, data: unknown) => apiClient.put(`/equipment/${id}`, data),
  startUsage: (id: string, data: unknown) => apiClient.post(`/equipment/${id}/usage/start`, data),
  endUsage: (id: string) => apiClient.post(`/equipment/${id}/usage/end`),
  getWorkOrders: (params?: { status?: string; equipmentId?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/maintenance/workorders${query}`);
  },
  createWorkOrder: (data: unknown) => apiClient.post('/maintenance/workorders', data),
  updateWorkOrder: (id: string, data: unknown) => apiClient.put(`/maintenance/workorders/${id}`, data),
  completeWorkOrder: (id: string) => apiClient.post(`/maintenance/workorders/${id}/complete`),
  getSpareParts: () => apiClient.get('/spare-parts'),
  createSparePart: (data: unknown) => apiClient.post('/spare-parts', data),
  updateSparePart: (id: string, data: unknown) => apiClient.put(`/spare-parts/${id}`, data),
};

export const workforceApi = {
  getWorkers: () => apiClient.get('/workers'),
  getWorker: (id: string) => apiClient.get(`/workers/${id}`),
  createWorker: (data: unknown) => apiClient.post('/workers', data),
  updateWorker: (id: string, data: unknown) => apiClient.put(`/workers/${id}`, data),
  deleteWorker: (id: string) => apiClient.delete(`/workers/${id}`),
  getTeams: () => apiClient.get('/teams'),
  getTeam: (id: string) => apiClient.get(`/teams/${id}`),
  createTeam: (data: unknown) => apiClient.post('/teams', data),
  updateTeam: (id: string, data: unknown) => apiClient.put(`/teams/${id}`, data),
  deleteTeam: (id: string) => apiClient.delete(`/teams/${id}`),
  recordWorkHours: (data: unknown) => apiClient.post('/workhours', data),
  getWorkHoursStats: (params?: { startDate?: string; endDate?: string; groupBy?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/workhours/statistics${query}`);
  },
};

export const statisticsApi = {
  getProgressStats: (params?: { projectId?: string; startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/progress${query}`);
  },
  getMaterialStats: (params?: { projectId?: string; startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/materials${query}`);
  },
  getSafetyStats: (params?: { projectId?: string; startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/safety${query}`);
  },
  getWorkHoursStats: (params?: { teamId?: string; startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/workhours${query}`);
  },
  getEquipmentStats: (params?: { startDate?: string; endDate?: string }) => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return apiClient.get(`/equipment${query}`);
  },
  generateReport: (data: unknown) => apiClient.post('/reports/generate', data),
  downloadReport: (id: string) => apiClient.get(`/reports/${id}/download`),
};

export const floorPlanApi = {
  getFloorPlans: () => apiClient.get('/floorplans'),
  getFloorPlan: (projectId: string) => apiClient.get(`/floorplans/${projectId}`),
  createFloorPlan: (data: unknown) => apiClient.post('/floorplans', data),
  updateFloorPlan: (id: string, data: unknown) => apiClient.put(`/floorplans/${id}`, data),
  deleteFloorPlan: (id: string) => apiClient.delete(`/floorplans/${id}`),
  getHeatmap: (projectId: string) => apiClient.get(`/floorplans/${projectId}/heatmap`),
  getLocations: (projectId: string) => apiClient.get(`/floorplans/${projectId}/locations`),
  updateLocation: (entityType: string, entityId: string, data: unknown) =>
    apiClient.put(`/floorplans/locations/${entityType}/${entityId}`, data),
};
