import './App.css';
import { WizardProvider, useWizard } from './context/WizardContext';
import { Header } from './components/Header';
import { StepNav } from './components/StepNav';
import { SummarySidebar } from './components/SummarySidebar';
import { TipBanner } from './components/TipBanner';
import { Step1Employee } from './steps/Step1Employee';
import { Step2Position } from './steps/Step2Position';
import { Step3Access } from './steps/Step3Access';
import { Step4Equipment } from './steps/Step4Equipment';
import { Step5Applications } from './steps/Step5Applications';
import { Step6Review } from './steps/Step6Review';
import { Step2Cessation } from './steps/Step2Cessation';
import { Step3DepartmentComments } from './steps/Step3DepartmentComments';
import { StepReviewOffboarding } from './steps/StepReviewOffboarding';
import { TYPE_DEMANDE_TERMINAISON } from './types';

const ONBOARDING_STEP_COMPONENTS = [
  Step1Employee,
  Step2Position,
  Step3Access,
  Step4Equipment,
  Step5Applications,
  Step6Review,
];

const OFFBOARDING_STEP_COMPONENTS = [Step1Employee, Step2Cessation, Step3DepartmentComments, StepReviewOffboarding];

function WizardBody() {
  const { currentStep, request } = useWizard();
  const components =
    request.typeDemande === TYPE_DEMANDE_TERMINAISON ? OFFBOARDING_STEP_COMPONENTS : ONBOARDING_STEP_COMPONENTS;
  const StepComponent = components[currentStep] ?? components[0];

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <StepNav />
        <StepComponent />
        <SummarySidebar />
      </div>
      <TipBanner />
    </div>
  );
}

function App() {
  return (
    <WizardProvider>
      <WizardBody />
    </WizardProvider>
  );
}

export default App;
