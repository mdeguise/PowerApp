import type { EmployeeDirectoryEntry } from '../types';

export const DEPARTEMENTS = [
  'Opérations montagne',
  'Hébergement',
  'Ventes et marketing',
  'Ressources humaines',
  'Finances',
  'Technologies de l\'information',
  'Restauration',
  'École de ski',
];

export const TYPES_EMPLOI = ['Temps plein - permanent', 'Temps plein - saisonnier', 'Temps partiel', 'Contractuel'];

export const REGLE_DE_PAYE_AUTRE = 'AUTRES PRÉCISÉ DANS COMMENTAIRES';

export const REGLES_DE_PAYE = [
  '05H45 SANS REPAS',
  '7H30 AVEC 60 MIN DE REPAS',
  '7H30 AVEC 30 MIN DE REPAS',
  '8h SANS REPAS',
  '8H AVEC 30 MINUTES REPAS',
  '10H SANS REPAS',
  '10H AVEC 30 MINUTES REPAS',
  REGLE_DE_PAYE_AUTRE,
];

export const EMPLOYEE_DIRECTORY: EmployeeDirectoryEntry[] = [
  { id: 'e1', numeroEmploye: '100234', prenom: 'Alexandre', nom: 'Gagnon', poste: 'Patrouilleur', departement: 'Opérations montagne', codeEmploi: 'OPM-PAT-01', typeEmploi: 'Temps plein - saisonnier', gestionnaire: 'Marc Bélanger' },
  { id: 'e2', numeroEmploye: '100567', prenom: 'Sophie', nom: 'Tremblay', poste: 'Agent à la réception', departement: 'Hébergement', codeEmploi: 'HEB-REC-02', typeEmploi: 'Temps plein - permanent', gestionnaire: 'Julie Roy' },
  { id: 'e3', numeroEmploye: '100812', prenom: 'Maxime', nom: 'Bouchard', poste: 'Conseiller aux ventes', departement: 'Ventes et marketing', codeEmploi: 'VTM-CSV-01', typeEmploi: 'Temps plein - permanent', gestionnaire: 'Isabelle Côté' },
  { id: 'e4', numeroEmploye: '100945', prenom: 'Camille', nom: 'Lavoie', poste: 'Généraliste RH', departement: 'Ressources humaines', codeEmploi: 'RH-GEN-01', typeEmploi: 'Temps plein - permanent', gestionnaire: 'Marie Tremblay' },
  { id: 'e5', numeroEmploye: '101023', prenom: 'Olivier', nom: 'Fortin', poste: 'Technicien comptable', departement: 'Finances', codeEmploi: 'FIN-TEC-02', typeEmploi: 'Temps plein - permanent', gestionnaire: 'David Simard' },
  { id: 'e6', numeroEmploye: '101187', prenom: 'Laurence', nom: 'Morin', poste: 'Technicien TI', departement: 'Technologies de l\'information', codeEmploi: 'TI-TEC-03', typeEmploi: 'Temps plein - permanent', gestionnaire: 'Patrick Ouellet' },
  { id: 'e7', numeroEmploye: '101256', prenom: 'Gabriel', nom: 'Roy', poste: 'Cuisinier', departement: 'Restauration', codeEmploi: 'RES-CUI-01', typeEmploi: 'Temps plein - saisonnier', gestionnaire: 'Nathalie Pelletier' },
  { id: 'e8', numeroEmploye: '101340', prenom: 'Emma', nom: 'Bergeron', poste: 'Moniteur de ski', departement: 'École de ski', codeEmploi: 'ESK-MON-01', typeEmploi: 'Temps plein - saisonnier', gestionnaire: 'François Gagné' },
  { id: 'e9', numeroEmploye: '101412', prenom: 'Samuel', nom: 'Girard', poste: 'Opérateur de remontée', departement: 'Opérations montagne', codeEmploi: 'OPM-OPR-02', typeEmploi: 'Temps partiel', gestionnaire: 'Marc Bélanger' },
  { id: 'e10', numeroEmploye: '101488', prenom: 'Charlotte', nom: 'Nadeau', poste: 'Concierge', departement: 'Hébergement', codeEmploi: 'HEB-CON-01', typeEmploi: 'Temps plein - permanent', gestionnaire: 'Julie Roy' },
];

export interface AccessSystem {
  id: string;
  nom: string;
  description: string;
}

export const SYSTEMES_ACCES: AccessSystem[] = [
  { id: 'ad', nom: 'Compte Active Directory / courriel', description: 'Compte réseau et boîte courriel @tremblant.ca' },
  { id: 'vpn', nom: 'Accès VPN', description: 'Accès à distance au réseau corporatif' },
  { id: 'badge', nom: 'Badge d\'accès aux édifices', description: 'Accès physique aux bureaux et installations' },
];

export const POS_HEBERGEMENT_SYSTEMES = ['RTP', 'SMS', 'OPERA', 'SYMPHONIE', 'APROPOS'];

export interface EquipmentItem {
  id: string;
  nom: string;
  categorie: string;
}

export const EQUIPEMENTS: EquipmentItem[] = [
  { id: 'laptop', nom: 'Ordinateur portable', categorie: 'Informatique' },
  { id: 'desktop', nom: 'Ordinateur de bureau', categorie: 'Informatique' },
  { id: 'monitor', nom: 'Écran additionnel', categorie: 'Informatique' },
  { id: 'phone', nom: 'Téléphone cellulaire', categorie: 'Télécommunications' },
  { id: 'radio', nom: 'Radio bidirectionnelle', categorie: 'Télécommunications' },
  { id: 'uniform', nom: 'Uniforme / vêtements corporatifs', categorie: 'Équipement de travail' },
  { id: 'skipass', nom: 'Laissez-passer de saison', categorie: 'Équipement de travail' },
];

export interface ApplicationItem {
  id: string;
  nom: string;
  editeur: string;
}

export const APPLICATIONS: ApplicationItem[] = [
  { id: 'm365', nom: 'Microsoft 365', editeur: 'Microsoft' },
  { id: 'teams', nom: 'Teams', editeur: 'Microsoft' },
  { id: 'dynamics', nom: 'Dynamics 365', editeur: 'Microsoft' },
];

export const OUI_NON = ['Oui', 'Non'];

export const RAISONS_ARRET = [
  'Fin de saison / mise à pied saisonnière',
  'Mise à pied temporaire (manque de travail)',
  'Démission volontaire',
  'Congédiement',
  'Fin de contrat',
  'Retraite',
  'Autre',
];

export const REEMBAUCHERIEZ_OPTIONS = ['Oui', 'Non', 'À déterminer'];
