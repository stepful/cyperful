import { createContext, useContext, useState } from 'react';

import { Step, useStepsData } from './data';

const HoverContext = createContext<{
  step: Step | null;
  setStepIndex: (index: number | null) => void;
}>({
  step: null,
  setStepIndex: () => {},
});
export const HoverProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stepIndex, setStepIndex] = useState<number | null>(null);

  const { steps, test_status } = useStepsData() || {};

  const step =
    steps && test_status !== 'running' && stepIndex != null
      ? steps[stepIndex]
      : null;

  return (
    <HoverContext.Provider value={{ step, setStepIndex }}>
      {children}
    </HoverContext.Provider>
  );
};
export const useHover = () => {
  const ctx = useContext(HoverContext);
  if (!ctx) throw new Error('Missing HoverProvider');
  return ctx;
};
