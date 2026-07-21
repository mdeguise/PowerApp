export type RequestStatus = 'Brouillon' | 'Soumise' | 'En traitement' | 'Complétée';

export const TYPE_DEMANDE_TERMINAISON = 'Avis de terminaison ou mise à pied temporaire';

export type TypeDemande = 'Nouvelle intégration' | 'Réactivation' | typeof TYPE_DEMANDE_TERMINAISON | '';

export interface EmployeeDirectoryEntry {
  id: string;
  numeroEmploye: string;
  prenom: string;
  nom: string;
  poste: string;
  departement: string;
  codeEmploi: string;
  typeEmploi: string;
  gestionnaire: string;
}

export interface EmployeeSelectionInfo {
  employeeId: string | null;
  dateEntreePrevue: string;
  regleDePaye: string;
  regleDePayeCommentaire: string;
}

export interface AccessInfo {
  systemes: string[];
  posHebergement: string[];
  badgeZones: string;
  justification: string;
  stationnement: string;
}

export interface EquipmentInfo {
  equipements: string[];
  notes: string;
}

export interface ApplicationsInfo {
  applications: string[];
  autreLogiciel: string;
}

export interface OffboardingInfo {
  employeeIds: string[];
  derniereJournee: string;
  indemniteVacances: string;
  raisonArret: string;
  detailsRaison: string;
  reembaucheriez: string;
  attachments: File[];
  commentairesRH: string;
  commentairesIT: string;
  commentairesParkingAcces: string;
  commentairesRedingote: string;
}

export interface OnboardingRequest {
  demandeNumero: string;
  dateCreation: string;
  demandePar: string;
  statut: RequestStatus;
  typeDemande: TypeDemande;
  employee: EmployeeSelectionInfo;
  access: AccessInfo;
  equipment: EquipmentInfo;
  applications: ApplicationsInfo;
  offboarding: OffboardingInfo;
}

export function createEmptyRequest(): OnboardingRequest {
  return {
    demandeNumero: 'INT-2025-00024',
    dateCreation: new Date().toISOString().slice(0, 10),
    demandePar: 'Marie Tremblay',
    statut: 'Brouillon',
    typeDemande: '',
    employee: {
      employeeId: null,
      dateEntreePrevue: '',
      regleDePaye: '',
      regleDePayeCommentaire: '',
    },
    access: {
      systemes: [],
      posHebergement: [],
      badgeZones: '',
      justification: '',
      stationnement: '',
    },
    equipment: {
      equipements: [],
      notes: '',
    },
    applications: {
      applications: [],
      autreLogiciel: '',
    },
    offboarding: {
      employeeIds: [],
      derniereJournee: '',
      indemniteVacances: '',
      raisonArret: '',
      detailsRaison: '',
      reembaucheriez: '',
      attachments: [],
      commentairesRH: '',
      commentairesIT: '',
      commentairesParkingAcces: '',
      commentairesRedingote: '',
    },
  };
}
