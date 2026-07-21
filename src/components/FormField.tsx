import type { ReactNode } from 'react';
import { CheckIcon } from './icons';

interface FieldProps {
  label: ReactNode;
  required?: boolean;
  children: ReactNode;
  valid?: boolean;
}

export function Field({ label, required, children, valid }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="field__input-wrap">
        {children}
        {valid && <CheckIcon className="field__check-icon" style={{ width: 16, height: 16 }} />}
      </div>
    </div>
  );
}

interface SectionTitleProps {
  icon: ReactNode;
  children: ReactNode;
}

export function SectionTitle({ icon, children }: SectionTitleProps) {
  return (
    <div className="field-section-title">
      <span className="field-section-title__icon">{icon}</span>
      {children}
    </div>
  );
}
