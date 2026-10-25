import { cloneElement, isValidElement, useId, type ReactElement } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>;
  className?: string;
}

export function FormField({ label, error, hint, children, className = '' }: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })
    : children;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      {control}
      {(error || hint) && (
        <p id={messageId} className={error ? 'field__error' : 'field__hint'}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
