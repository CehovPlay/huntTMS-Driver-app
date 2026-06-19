import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Stage = 'pickup' | 'delivery' | 'delivered';

// Documents the driver MUST upload before a load can be closed (delivered).
// Strings match the doc types in the upload sheet (see DOC_TYPES).
export const REQUIRED_DOCS = ['Bill of landing', 'Proof of delivery'] as const;

type ActiveLoad = {
  stage: Stage;
  docs: string[]; // uploaded document types
  completedRefs: string[]; // loads delivered this session (persist across reset)
  missingDocs: string[]; // required docs not yet uploaded
  canDeliver: boolean; // all required docs uploaded
  advance: () => void; // pickup -> delivery -> delivered
  addDoc: (type: string) => void;
  markDelivered: (ref: string) => void;
  reset: () => void;
};

const Ctx = createContext<ActiveLoad | null>(null);

export function ActiveLoadProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>('pickup');
  const [docs, setDocs] = useState<string[]>([]);
  const [completedRefs, setCompletedRefs] = useState<string[]>([]);

  const advance = () =>
    setStage((s) => (s === 'pickup' ? 'delivery' : s === 'delivery' ? 'delivered' : s));
  const addDoc = (type: string) => setDocs((d) => (d.includes(type) ? d : [...d, type]));
  const markDelivered = (ref: string) =>
    setCompletedRefs((r) => (r.includes(ref) ? r : [...r, ref]));
  const reset = () => {
    setStage('pickup');
    setDocs([]);
  };

  const missingDocs = useMemo(() => REQUIRED_DOCS.filter((d) => !docs.includes(d)), [docs]);
  const canDeliver = missingDocs.length === 0;

  return (
    <Ctx.Provider
      value={{ stage, docs, completedRefs, missingDocs, canDeliver, advance, addDoc, markDelivered, reset }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useActiveLoad() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useActiveLoad must be used within ActiveLoadProvider');
  return ctx;
}
