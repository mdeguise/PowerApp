import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { createEmptyRequest, TYPE_DEMANDE_TERMINAISON, type OnboardingRequest, type TypeDemande } from '../types';
import { REGLE_DE_PAYE_AUTRE } from '../data/catalogs';

export interface StepDescriptor {
  key: string;
  numero: number;
  titre: string;
  sousTitre: string;
}

export const ONBOARDING_STEPS: StepDescriptor[] = [
  { key: 'employee', numero: 1, titre: 'Employé', sousTitre: "Sélection de l'employé" },
  { key: 'position', numero: 2, titre: 'Poste et département', sousTitre: 'Détails du poste' },
  { key: 'access', numero: 3, titre: 'Accès et comptes', sousTitre: 'Systèmes et accès requis' },
  { key: 'equipment', numero: 4, titre: 'Équipement', sousTitre: 'Matériel requis' },
  { key: 'applications', numero: 5, titre: 'Applications', sousTitre: 'Logiciels et licences' },
  { key: 'review', numero: 6, titre: 'Révision et soumission', sousTitre: 'Vérifier et envoyer' },
];

export const OFFBOARDING_STEPS: StepDescriptor[] = [
  { key: 'employees', numero: 1, titre: 'Employé(s)', sousTitre: 'Sélection des employés' },
  { key: 'cessation', numero: 2, titre: 'Détails de la cessation', sousTitre: 'Informations requises' },
  { key: 'comments', numero: 3, titre: 'Commentaires par département', sousTitre: 'RH, TI, stationnement, matériel' },
  { key: 'review', numero: 4, titre: 'Révision et soumission', sousTitre: 'Vérifier et envoyer' },
];

function stepsFor(typeDemande: TypeDemande): StepDescriptor[] {
  return typeDemande === TYPE_DEMANDE_TERMINAISON ? OFFBOARDING_STEPS : ONBOARDING_STEPS;
}

interface WizardContextValue {
  request: OnboardingRequest;
  setRequest: React.Dispatch<React.SetStateAction<OnboardingRequest>>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  furthestStep: number;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  isStepValid: (step: number) => boolean;
  progressLabel: string;
  steps: StepDescriptor[];
  stepCount: number;
  setTypeDemande: (typeDemande: TypeDemande) => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

function validateStep(step: number, request: OnboardingRequest): boolean {
  if (request.typeDemande === TYPE_DEMANDE_TERMINAISON) {
    switch (step) {
      case 0:
        return Boolean(request.typeDemande && request.offboarding.employeeIds.length > 0);
      case 1: {
        const o = request.offboarding;
        return Boolean(o.derniereJournee && o.indemniteVacances && o.raisonArret && o.detailsRaison && o.reembaucheriez);
      }
      default:
        return true;
    }
  }

  switch (step) {
    case 0: {
      const e = request.employee;
      const regleValid =
        e.regleDePaye && (e.regleDePaye !== REGLE_DE_PAYE_AUTRE || Boolean(e.regleDePayeCommentaire));
      return Boolean(request.typeDemande && e.employeeId && e.dateEntreePrevue && regleValid);
    }
    default:
      return true;
  }
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<OnboardingRequest>(createEmptyRequest);
  const [currentStep, setCurrentStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);

  const steps = useMemo(() => stepsFor(request.typeDemande), [request.typeDemande]);
  const stepCount = steps.length;

  const goToStep = (step: number) => {
    const clamped = Math.max(0, Math.min(stepCount - 1, step));
    setCurrentStep(clamped);
    setFurthestStep((f) => Math.max(f, clamped));
  };

  const goNext = () => goToStep(currentStep + 1);
  const goBack = () => goToStep(currentStep - 1);

  const isStepValid = (step: number) => validateStep(step, request);

  const progressLabel = useMemo(() => `${currentStep + 1} / ${stepCount} étapes`, [currentStep, stepCount]);

  const setTypeDemande = (typeDemande: TypeDemande) => {
    setRequest((prev) => ({ ...prev, typeDemande }));
    setFurthestStep(currentStep);
  };

  const value: WizardContextValue = {
    request,
    setRequest,
    currentStep,
    setCurrentStep,
    furthestStep,
    goNext,
    goBack,
    goToStep,
    isStepValid,
    progressLabel,
    steps,
    stepCount,
    setTypeDemande,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}
