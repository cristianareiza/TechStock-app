import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/layout/AppLayout';
import { FormField } from '../../components/ui/FormField';
import { Icon } from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../core/http/ApiError';
import { Validator, rules } from '../../core/validation/Validator';

interface LoginValues {
  email: string;
  password: string;
}

const loginValidator = new Validator<LoginValues>()
  .field('email', rules.required('Ingresa tu correo'), rules.email())
  .field('password', rules.required('Ingresa tu contraseña'));

const DEMO_ACCOUNTS = [
  { label: 'Administrador', email: 'admin@techstock.com', password: 'Admin123*' },
  { label: 'Empleado', email: 'empleado@techstock.com', password: 'Empleado123*' },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<LoginValues>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={redirectTo} replace />;

  const update = (field: keyof LoginValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validation = loginValidator.validate(values);
    setErrors(validation);
    setFormError('');
    if (Object.keys(validation).length > 0) return;

    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'No fue posible iniciar sesión');
      setSubmitting(false);
    }
  };

  return (
    <div className="login">
      <section className="login__brand" aria-hidden="true">
        <Logo />
        <div className="login__pitch">
          <p className="eyebrow">Inventario para tiendas de tecnología</p>
          <h2>Cada equipo, cada unidad, bajo control.</h2>
          <p>Gestiona productos, controla el stock y administra tu equipo de trabajo desde un solo lugar.</p>
        </div>
        <div className="login__grid">
          {['Laptops', 'Celulares', 'Monitores', 'Audio'].map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </section>

      <section className="login__panel">
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className="login__mobile-logo">
            <Logo />
          </div>
          <h1>Iniciar sesión</h1>
          <p className="muted">Ingresa con tu cuenta para continuar.</p>

          {formError && (
            <div className="alert alert--error" role="alert">
              <Icon name="alert" size={18} />
              {formError}
            </div>
          )}

          <FormField label="Correo electrónico" error={errors.email}>
            <input
              type="email"
              className="input"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={values.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </FormField>

          <FormField label="Contraseña" error={errors.password}>
            <input
              type="password"
              className="input"
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </FormField>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>

          <div className="demo-accounts">
            <p>Cuentas de demostración</p>
            <div>
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setValues({ email: account.email, password: account.password });
                    setErrors({});
                  }}
                >
                  {account.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
