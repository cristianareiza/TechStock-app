import { useState, type FormEvent } from 'react';
import { FormField } from '../../components/ui/FormField';
import { Icon } from '../../components/ui/Icon';
import { ApiError } from '../../core/http/ApiError';
import { PRODUCT_CATEGORIES, type ProductInput } from '../../models/types';
import {
  EMPTY_PRODUCT_FORM,
  formValuesToProductInput,
  productValidator,
  type ProductFormValues,
} from './productFormModel';

interface ProductFormProps {
  initialValues?: ProductFormValues;
  submitLabel: string;
  onSubmit: (input: ProductInput) => Promise<void>;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof ProductFormValues, string>>;

export function ProductForm({ initialValues = EMPTY_PRODUCT_FORM, submitLabel, onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = productValidator.validate(values);
    setErrors(validation);
    setFormError('');
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(formValuesToProductInput(values));
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors() as Errors);
        setFormError(error.message);
      } else {
        setFormError('No se pudo guardar el producto');
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

      <FormField label="SKU" error={errors.sku} hint="Código único, ej. LAP-ASUS-001">
        <input
          className="input mono"
          value={values.sku}
          onChange={(e) => update('sku', e.target.value.toUpperCase())}
          maxLength={20}
        />
      </FormField>

      <FormField label="Categoría" error={errors.category}>
        <select
          className="input"
          value={values.category}
          onChange={(e) => update('category', e.target.value as ProductFormValues['category'])}
        >
          <option value="">Selecciona…</option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Nombre" error={errors.name} className="form-grid__full">
        <input className="input" value={values.name} onChange={(e) => update('name', e.target.value)} maxLength={120} />
      </FormField>

      <FormField label="Descripción" error={errors.description} className="form-grid__full">
        <textarea
          className="input"
          rows={3}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          maxLength={500}
        />
      </FormField>

      <FormField label="Precio (COP)" error={errors.price} className="form-grid__full">
        <input
          className="input tabular"
          type="number"
          inputMode="decimal"
          min={0}
          step="100"
          value={values.price}
          onChange={(e) => update('price', e.target.value)}
        />
      </FormField>

      <FormField label="Stock actual" error={errors.stock}>
        <input
          className="input tabular"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={values.stock}
          onChange={(e) => update('stock', e.target.value)}
        />
      </FormField>

      <FormField label="Stock mínimo" error={errors.minStock} hint="Alerta de reposición">
        <input
          className="input tabular"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={values.minStock}
          onChange={(e) => update('minStock', e.target.value)}
        />
      </FormField>

      <div className="form-actions form-grid__full">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
