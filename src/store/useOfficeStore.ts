import { create } from 'zustand';
import { OfficeUpdatePayload, AgentState } from '../types/office';

interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

interface OfficeStore {
  officeData: OfficeUpdatePayload | null;
  selectedAgentId: string | null;
  activeRoomFilter: string;
  viewMode: 'roblox' | '2d' | 'master';
  camera: CameraState;
  simSpeed: number;
  isConnected: boolean;
  fps: number;

  setOfficeData: (data: OfficeUpdatePayload) => void;
  setSelectedAgentId: (id: string | null) => void;
  setActiveRoomFilter: (room: string) => void;
  setViewMode: (mode: 'roblox' | '2d' | 'master') => void;
  setCamera: (cam: Partial<CameraState>) => void;
  setSimSpeed: (speed: number) => void;
  setIsConnected: (connected: boolean) => void;
  setFps: (fps: number) => void;
  resetCamera: () => void;
  focusRoom: (roomKey: string) => void;
  focusAgent: (agentId: string) => void;
}

const DEFAULT_CAMERA: CameraState = {
  x: 0,
  y: 0,
  zoom: 1.0,
};

export const ROOM_COORDINATES: Record<string, { x: number; y: number; zoom: number; label: string }> = {
  all: { x: 0, y: 0, zoom: 1.0, label: 'Full Campus' },
  manager: { x: 220, y: 150, zoom: 1.4, label: 'Executive Suite' },
  dev: { x: 500, y: 160, zoom: 1.3, label: 'Development Lab' },
  research: { x: 830, y: 150, zoom: 1.4, label: 'Research & Intel' },
  meeting: { x: 500, y: 360, zoom: 1.5, label: 'War Room / A2A' },
  qa_security: { x: 230, y: 480, zoom: 1.3, label: 'QA & Hardening' },
  lounge: { x: 540, y: 520, zoom: 1.4, label: 'Lounge & Operations' },
  server_room: { x: 860, y: 480, zoom: 1.4, label: 'SRE & Infra' },
};

const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const initialRoom = urlParams?.get('room') || 'all';
const initialAgent = urlParams?.get('agent') || null;

export const useOfficeStore = create<OfficeStore>((set, get) => ({
  officeData: null,
  selectedAgentId: initialAgent,
  activeRoomFilter: initialRoom,
  viewMode: 'roblox',
  camera: { ...DEFAULT_CAMERA },
  simSpeed: 1,
  isConnected: false,
  fps: 60,

  setOfficeData: (data) => set({ officeData: data }),
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
  setActiveRoomFilter: (room) => {
    set({ activeRoomFilter: room });
    get().focusRoom(room);
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setCamera: (cam) => set((s) => ({ camera: { ...s.camera, ...cam } })),
  setSimSpeed: (speed) => set({ simSpeed: speed }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setFps: (fps) => set({ fps }),
  resetCamera: () => set({ camera: { ...DEFAULT_CAMERA }, activeRoomFilter: 'all' }),
  
  focusRoom: (roomKey) => {
    const target = ROOM_COORDINATES[roomKey];
    if (target) {
      if (roomKey === 'all') {
        set({ camera: { ...DEFAULT_CAMERA }, activeRoomFilter: 'all' });
      } else {
        set({
          camera: {
            x: -(target.x - 520),
            y: -(target.y - 335),
            zoom: target.zoom,
          },
          activeRoomFilter: roomKey,
        });
      }
    }
  },

  focusAgent: (agentId) => {
    const { officeData } = get();
    if (officeData && officeData.agents[agentId]) {
      const agent = officeData.agents[agentId];
      set({
        selectedAgentId: agentId,
        camera: {
          x: -(agent.homeDesk.x - 500),
          y: -(agent.homeDesk.y - 350),
          zoom: 1.4,
        },
      });
    }
  },
}));
