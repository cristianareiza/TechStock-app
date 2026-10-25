import { Validator, rules, type Rule } from '../../core/validation/Validator';
import type { User } from '../../models/User';
import type { Role, UserInput } from '../../models/types';

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
}

export const EMPTY_USER_FORM: UserFormValues = {
  name: '',
  email: '',
  password: '',
  role: 'employee',
  active: true,
};

const passwordRules: Rule<UserFormValues>[] = [
  rules.minLength(8, 'Mínimo 8 caracteres'),
  rules.maxLength(72),
  rules.pattern(/[A-Z]/, 'Debe incluir al menos una mayúscula'),
  rules.pattern(/[0-9]/, 'Debe incluir al menos un número'),
];

export function createUserValidator(mode: 'create' | 'edit') {
  return new Validator<UserFormValues>()
    .field('name', rules.required('El nombre es obligatorio'), rules.minLength(3), rules.maxLength(80))
    .field('email', rules.required('El correo es obligatorio'), rules.email())
    .field(
      'password',
      ...(mode === 'create' ? [rules.required<UserFormValues>('La contraseña es obligatoria')] : []),
      ...passwordRules,
    );
}

export function userToFormValues(user: User): UserFormValues {
  return { name: user.name, email: user.email, password: '', role: user.role, active: user.active };
}

export function formValuesToUserInput(values: UserFormValues): UserInput {
  const input: UserInput = {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    role: values.role,
    active: values.active,
  };
  if (values.password) input.password = values.password;
  return input;
}
