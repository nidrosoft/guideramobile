/**
 * USE BOOKING FLOW HOOK
 * 
 * Manages step navigation and flow state for booking wizards.
 */

import { useState, useCallback, useMemo } from 'react';
import { StepConfig } from '../types/booking.types';
import { getStepIndex, isFirstStep, isLastStep, getProgress } from '../config/steps.config';

interface UseBookingFlowOptions {
  steps: StepConfig[];
  initialStep?: string;
  onStepChange?: (stepId: string, stepIndex: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

interface UseBookingFlowReturn {
  // Current state
  currentStep: StepConfig;
  currentStepIndex: number;
  totalSteps: number;
  progress: number;
  
  // Navigation flags
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
  
  // Navigation actions
  goNext: () => void;
  goBack: () => void;
  goToStep: (stepId: string) => void;
  goToStepIndex: (index: number) => void;
  
  // Flow actions
  complete: () => void;
  cancel: () => void;
  reset: () => void;
  
  // Step validation
  setStepValid: (stepId: string, isValid: boolean) => void;
  isStepValid: (stepId: string) => boolean;
  areAllStepsValid: () => boolean;
  
  // Visited steps
  visitedSteps: string[];
  hasVisitedStep: (stepId: string) => boolean;
}

export function useBookingFlow({
  steps,
  initialStep,
  onStepChange,
  onComplete,
  onCancel,
}: UseBookingFlowOptions): UseBookingFlowReturn {
  // Find initial step index
  const initialIndex = initialStep 
    ? getStepIndex(steps, initialStep) 
    : 0;
  
  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0
  );
  const [visitedSteps, setVisitedSteps] = useState<string[]>([
    steps[initialIndex >= 0 ? initialIndex : 0]?.id,
  ].filter(Boolean));
  const [validSteps, setValidSteps] = useState<Record<string, boolean>>({});
  
  // Derived values
  const currentStep = useMemo(
    () => steps[currentStepIndex],
    [steps, currentStepIndex]
  );
  
  const totalSteps = steps.length;
  
  const progress = useMemo(
    () => getProgress(steps, currentStep?.id || ''),
    [steps, currentStep]
  );
  
  const isFirst = useMemo(
    () => isFirstStep(steps, currentStep?.id || ''),
    [steps, currentStep]
  );
  
  const isLast = useMemo(
    () => isLastStep(steps, currentStep?.id || ''),
    [steps, currentStep]
  );
  
  // Navigation actions
  const goNext = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = steps[nextIndex];
      
      setCurrentStepIndex(nextIndex);
      setVisitedSteps((prev) => 
        prev.includes(nextStep.id) ? prev : [...prev, nextStep.id]
      );
      
      onStepChange?.(nextStep.id, nextIndex);
    } else {
      // Last step - complete the flow
      onComplete?.();
    }
  }, [currentStepIndex, totalSteps, steps, onStepChange, onComplete]);
  
  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStep = steps[prevIndex];
      
      setCurrentStepIndex(prevIndex);
      onStepChange?.(prevStep.id, prevIndex);
    } else {
      // First step - cancel the flow
      onCancel?.();
    }
  }, [currentStepIndex, steps, onStepChange, onCancel]);
  
  const goToStep = useCallback((stepId: string) => {
    const index = getStepIndex(steps, stepId);
    if (index >= 0) {
      setCurrentStepIndex(index);
      setVisitedSteps((prev) =>
        prev.includes(stepId) ? prev : [...prev, stepId]
      );
      onStepChange?.(stepId, index);
    }
  }, [steps, onStepChange]);
  
  const goToStepIndex = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      const step = steps[index];
      setCurrentStepIndex(index);
      setVisitedSteps((prev) =>
        prev.includes(step.id) ? prev : [...prev, step.id]
      );
      onStepChange?.(step.id, index);
    }
  }, [totalSteps, steps, onStepChange]);
  
  // Flow actions
  const complete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);
  
  const cancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);
  
  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setVisitedSteps([steps[0]?.id].filter(Boolean));
    setValidSteps({});
  }, [steps]);
  
  // Step validation
  const setStepValid = useCallback((stepId: string, isValid: boolean) => {
    setValidSteps((prev) => ({ ...prev, [stepId]: isValid }));
  }, []);
  
  const isStepValid = useCallback((stepId: string) => {
    return validSteps[stepId] ?? false;
  }, [validSteps]);
  
  const areAllStepsValid = useCallback(() => {
    return steps
      .filter((step) => !step.optional)
      .every((step) => validSteps[step.id]);
  }, [steps, validSteps]);
  
  // Visited steps
  const hasVisitedStep = useCallback((stepId: string) => {
    return visitedSteps.includes(stepId);
  }, [visitedSteps]);
  
  return {
    // Current state
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    
    // Navigation flags
    isFirstStep: isFirst,
    isLastStep: isLast,
    canGoBack: !isFirst,
    canGoNext: !isLast,
    
    // Navigation actions
    goNext,
    goBack,
    goToStep,
    goToStepIndex,
    
    // Flow actions
    complete,
    cancel,
    reset,
    
    // Step validation
    setStepValid,
    isStepValid,
    areAllStepsValid,
    
    // Visited steps
    visitedSteps,
    hasVisitedStep,
  };
}
