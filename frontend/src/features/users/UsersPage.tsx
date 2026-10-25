import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/layout/AppLayout';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../core/http/ApiError';
import type { User } from '../../models/User';
import type { Role, UserInput } from '../../models/types';
import { userService } from '../../services';
import { UserForm } from './UserForm';
import { userToFormValues } from './userFormModel';

type FormState = { mode: 'create' } | { mode: 'edit'; user: User } | null;

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await userService.getAll());
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (users ?? []).filter(
      (u) =>
        (!roleFilter || u.role === roleFilter) &&
        (!term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)),
    );
  }, [users, search, roleFilter]);

  const handleSave = async (input: UserInput) => {
    if (form?.mode === 'edit') {
      const updated = await userService.update(form.user.id, input);
      toast.success(`Se actualizó la cuenta de ${updated.name}`);
    } else {
      const created = await userService.create(input);
      toast.success(`Se creó la cuenta de ${created.name}`);
    }
    setForm(null);
    await load();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await userService.remove(toDelete.id);
      toast.success(`Se eliminó la cuenta de ${toDelete.name}`);
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo eliminar el usuario');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Administra las cuentas y los permisos del equipo."
        actions={
          <button className="btn btn--primary" onClick={() => setForm({ mode: 'create' })}>
            <Icon name="plus" size={16} /> Nuevo usuario
          </button>
        }
      />

      <section className="card">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={16} />
            <span className="sr-only">Buscar usuarios</span>
            <input
              className="input"
              type="search"
              placeholder="Buscar por nombre o correo…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="input toolbar__select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | '')}
            aria-label="Filtrar por rol"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="employee">Empleados</option>
          </select>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !users ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="users" title="Sin resultados" description="No hay usuarios que coincidan con la búsqueda." />
        ) : (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Registrado</th>
                  <th className="text-end">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id}>
                      <td className="cell-main">
                        <div className="user-cell">
                          <span className={`avatar ${u.isAdmin ? 'avatar--admin' : ''}`} aria-hidden="true">
                            {u.initials}
                          </span>
                          <div>
                            <div className="cell-title">
                              {u.name} {isSelf && <span className="you">Tú</span>}
                            </div>
                            <div className="cell-sub">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label="Rol">
                        <span className={`tag ${u.isAdmin ? 'tag--strong' : ''}`}>{u.roleLabel}</span>
                      </td>
                      <td data-label="Estado">
                        <span className={`status ${u.active ? 'status--on' : 'status--off'}`}>{u.statusLabel}</span>
                      </td>
                      <td className="muted nowrap" data-label="Registrado">{u.memberSince}</td>
                      <td className="text-end nowrap cell-actions">
                        <button
                          className="icon-btn"
                          onClick={() => setForm({ mode: 'edit', user: u })}
                          aria-label={`Editar ${u.name}`}
                          title="Editar"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          className="icon-btn icon-btn--danger"
                          onClick={() => setToDelete(u)}
                          disabled={isSelf}
                          aria-label={`Eliminar ${u.name}`}
                          title={isSelf ? 'No puedes eliminar tu propia cuenta' : 'Eliminar'}
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={form !== null}
        title={form?.mode === 'edit' ? 'Editar usuario' : 'Nuevo usuario'}
        description={form?.mode === 'edit' ? form.user.email : 'La persona podrá ingresar con este correo y contraseña.'}
        onClose={() => setForm(null)}
      >
        {form && (
          <UserForm
            key={form.mode === 'edit' ? form.user.id : 'new'}
            mode={form.mode}
            initialValues={form.mode === 'edit' ? userToFormValues(form.user) : undefined}
            isSelf={form.mode === 'edit' && form.user.id === currentUser?.id}
            onSubmit={handleSave}
            onCancel={() => setForm(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar usuario"
        message={
          <>
            ¿Seguro que deseas eliminar la cuenta de <strong>{toDelete?.name}</strong>? Perderá el acceso de inmediato.
          </>
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
