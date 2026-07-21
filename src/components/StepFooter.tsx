import { useWizard } from '../context/WizardContext';
import { ChevronRightIcon, SaveIcon } from './icons';

export function StepFooter({ onSubmit }: { onSubmit?: () => void }) {
  const { currentStep, stepCount, goNext, goBack, isStepValid } = useWizard();
  const isLast = currentStep === stepCount - 1;
  const canAdvance = isStepValid(currentStep);

  return (
    <div className="step-footer">
      <button type="button" className="btn btn-secondary">
        Annuler
      </button>
      <div className="step-footer__right">
        {currentStep > 0 && (
          <button type="button" className="btn btn-secondary" onClick={goBack}>
            Précédent
          </button>
        )}
        <button type="button" className="btn btn-secondary">
          <SaveIcon style={{ width: 16, height: 16 }} />
          Enregistrer le brouillon
        </button>
        {isLast ? (
          <button type="button" className="btn btn-primary" onClick={onSubmit}>
            Soumettre la demande
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={goNext} disabled={!canAdvance}>
            Suivant
            <ChevronRightIcon style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>
    </div>
  );
}
