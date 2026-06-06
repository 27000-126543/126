import { create } from 'zustand';
import type { UserRole, Project, Task, Material, SafetyAlarm, WebSocketMessage } from '@shared/types.js';
import { authApi, projectApi, taskApi, materialApi, safetyApi } from '../utils/apiClient.js';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    name: string;
    role: UserRole;
  } | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AppState {
  projects: Project[];
  tasks: Task[];
  materials: Material[];
  alarms: SafetyAlarm[];
  loading: boolean;
  error: string | null;
  websocketConnected: boolean;
  notifications: string[];
  fetchProjects: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchMaterials: () => Promise<void>;
  fetchAlarms: () => Promise<void>;
  addNotification: (message: string) => void;
  clearNotifications: () => void;
  handleWebSocketMessage: (message: WebSocketMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('authToken'),
  user: null,
  token: localStorage.getItem('authToken'),
  
  login: async (username, password) => {
    const response = await authApi.login(username, password);
    localStorage.setItem('authToken', response.token);
    set({
      isAuthenticated: true,
      user: { ...response.user, role: response.user.role as UserRole },
      token: response.token,
    });
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    set({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  },
}));

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  tasks: [],
  materials: [],
  alarms: [],
  loading: false,
  error: null,
  websocketConnected: false,
  notifications: [],
  
  fetchProjects: async () => {
    set({ loading: true });
    try {
      const data = await projectApi.getProjects() as Project[];
      set({ projects: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const data = await taskApi.getTasks() as Task[];
      set({ tasks: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchMaterials: async () => {
    set({ loading: true });
    try {
      const data = await materialApi.getMaterials() as Material[];
      set({ materials: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  fetchAlarms: async () => {
    set({ loading: true });
    try {
      const data = await safetyApi.getAlarms() as SafetyAlarm[];
      set({ alarms: data, error: null });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },
  
  addNotification: (message) => {
    set((state) => ({
      notifications: [...state.notifications, message].slice(-10),
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  handleWebSocketMessage: (message) => {
    switch (message.type) {
      case 'alarm':
        set((state) => ({
          alarms: [message.data as SafetyAlarm, ...state.alarms],
        }));
        get().addNotification('收到新的安全警报！');
        break;
      case 'evacuation':
        get().addNotification('紧急疏散指令！请立即撤离危险区域！');
        break;
      case 'sensor_reading':
        break;
      case 'task_update':
        get().fetchTasks();
        break;
    }
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
