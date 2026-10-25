import { useMemo, useState, type FormEvent } from 'react';
import { FormField } from '../../components/ui/FormField';
import { Icon } from '../../components/ui/Icon';
import { ApiError } from '../../core/http/ApiError';
import { User } from '../../models/User';
import type { UserInput } from '../../models/types';
import { EMPTY_USER_FORM, createUserValidator, formValuesToUserInput, type UserFormValues } from './userFormModel';

interface UserFormProps {
  mode: 'create' | 'edit';
  initialValues?: UserFormValues;
  isSelf?: boolean;
  onSubmit: (input: UserInput) => Promise<void>;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof UserFormValues, string>>;

export function UserForm({ mode, initialValues = EMPTY_USER_FORM, isSelf = false, onSubmit, onCancel }: UserFormProps) {
  const validator = useMemo(() => createUserValidator(mode), [mode]);
  const [values, setValues] = useState<UserFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = validator.validate(values);
    setErrors(validation);
    setFormError('');
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(formValuesToUserInput(values));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors() as Errors);
        setFormError(error.message);
      } else {
        setFormError('No se pudo guardar el usuario');
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="form-grid">
      {formError && (
        <div className="alert alert--error form-grid__full" role="alert">
          <Icon name="alert" size={18} />
          {formError}
        </div>
      )}

      <FormField label="Nombre completo" error={errors.name} className="form-grid__full">
        <input className="input" value={values.name} onChange={(e) => update('name', e.target.value)} autoComplete="off" />
      </FormField>

      <FormField label="Correo electrónico" error={errors.email} className="form-grid__full">
        <input
          className="input"
          type="email"
          value={values.email}
          onChange={(e) => update('email', e.target.value)}
          autoComplete="off"
        />
      </FormField>

      <FormField
        label={mode === 'create' ? 'Contraseña' : 'Nueva contraseña'}
        error={errors.password}
        hint={
          mode === 'create'
            ? 'Mínimo 8 caracteres, una mayúscula y un número'
            : 'Déjala vacía para conservar la actual'
        }
        className="form-grid__full"
      >
        <input
          className="input"
          type="password"
          value={values.password}
          onChange={(e) => update('password', e.target.value)}
          autoComplete="new-password"
        />
      </FormField>

      <FormField label="Rol" error={errors.role}>
        <select
          className="input"
          value={values.role}
          onChange={(e) => update('role', e.target.value as UserFormValues['role'])}
          disabled={isSelf}
        >
          <option value="employee">{User.roleLabel('employee')}</option>
          <option value="admin">{User.roleLabel('admin')}</option>
        </select>
      </FormField>

      <div className="field">
        <span className="field__label">Estado</span>
        <label className="switch switch--field">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(e) => update('active', e.target.checked)}
            disabled={isSelf}
          />
          <span className="switch__track" aria-hidden="true" />
          {values.active ? 'Activo' : 'Inactivo'}
        </label>
      </div>

      {isSelf && (
        <p className="field__hint form-grid__full">No puedes cambiar tu propio rol ni desactivar tu cuenta.</p>
      )}

      <div className="form-actions form-grid__full">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Guardando…' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
