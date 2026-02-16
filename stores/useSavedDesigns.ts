import { create } from 'zustand';

export interface SavedDesign {
  id: string;
  name: string;
  shelfType: 'flat' | 'corner';
  params: Record<string, number | boolean>;
  svgPreview?: string;
  createdAt: number;
  updatedAt: number;
}

interface SavedDesignsStore {
  designs: SavedDesign[];
  currentId: string | null;
  currentName: string;
  isDirty: boolean;

  loadDesigns: () => void;
  saveDesign: (name: string, shelfType: 'flat' | 'corner', params: Record<string, number | boolean>, svgPreview?: string) => void;
  replaceDesign: (id: string, params: Record<string, number | boolean>, svgPreview?: string) => void;
  loadDesign: (id: string) => SavedDesign | undefined;
  deleteDesign: (id: string) => void;
  renameDesign: (id: string, name: string) => void;
  setCurrentName: (name: string) => void;
  markDirty: () => void;
  resetToNew: () => void;
}

const STORAGE_KEY = 'squarage-saved-designs';

export const useSavedDesigns = create<SavedDesignsStore>((set, get) => ({
  designs: [],
  currentId: null,
  currentName: 'Untitled',
  isDirty: false,

  loadDesigns: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ designs: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load designs:', e);
    }
  },

  saveDesign: (name, shelfType, params, svgPreview) => {
    const design: SavedDesign = {
      id: `design-${Date.now()}`,
      name,
      shelfType,
      params: { ...params },
      svgPreview,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [...get().designs, design];
    set({
      designs: updated,
      currentId: design.id,
      currentName: name,
      isDirty: false,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  replaceDesign: (id, params, svgPreview) => {
    const existing = get().designs.find(d => d.id === id);
    if (!existing) return;
    const updated = get().designs.map(d =>
      d.id === id
        ? {
            ...d,
            params: { ...params },
            ...(svgPreview !== undefined ? { svgPreview } : {}),
            updatedAt: Date.now(),
          }
        : d
    );
    set({
      designs: updated,
      isDirty: false,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  loadDesign: (id) => {
    const design = get().designs.find(d => d.id === id);
    if (!design) return undefined;
    set({
      currentId: design.id,
      currentName: design.name,
      isDirty: false,
    });
    return { ...design, params: { ...design.params } };
  },

  deleteDesign: (id) => {
    const updated = get().designs.filter(d => d.id !== id);
    set({ designs: updated });
    if (get().currentId === id) {
      set({ currentId: null, currentName: 'Untitled', isDirty: false });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  renameDesign: (id, name) => {
    const updated = get().designs.map(d =>
      d.id === id ? { ...d, name, updatedAt: Date.now() } : d
    );
    set({ designs: updated });
    if (get().currentId === id) {
      set({ currentName: name });
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  setCurrentName: (name) => set({ currentName: name }),

  markDirty: () => {
    if (!get().isDirty) set({ isDirty: true });
  },

  resetToNew: () => set({ currentId: null, currentName: 'Untitled', isDirty: false }),
}));
