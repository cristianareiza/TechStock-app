import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/AppLayout';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Icon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState, ErrorState, Spinner } from '../../components/ui/States';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApiError } from '../../core/http/ApiError';
import { useDebounce } from '../../hooks/useDebounce';
import type { Product } from '../../models/Product';
import { PRODUCT_CATEGORIES, type ProductCategory, type ProductInput } from '../../models/types';
import { productService } from '../../services';
import type { ProductPage, ProductSortField } from '../../services/ProductService';
import { ProductForm } from './ProductForm';
import { productToFormValues } from './productFormModel';

const PAGE_SIZE = 8;

type FormState = { mode: 'create' } | { mode: 'edit'; product: Product } | null;

export function ProductsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [lowStock, setLowStock] = useState(searchParams.get('stock') === 'bajo');
  const [sort, setSort] = useState<{ field: ProductSortField; order: 'asc' | 'desc' }>({
    field: 'createdAt',
    order: 'desc',
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

  const [result, setResult] = useState<ProductPage | null>(null);
  const [error, setError] = useState('');
  const query = useMemo(
    () => ({ search: debouncedSearch, category, lowStock, page, limit: PAGE_SIZE, sort: sort.field, order: sort.order }),
    [debouncedSearch, category, lowStock, page, sort],
  );
  const [loadedQuery, setLoadedQuery] = useState<typeof query | null>(null);
  const loading = loadedQuery !== query;
  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await productService.search(query);
      // si la página quedó vacía después de eliminar, volver a la anterior
      if (data.items.length === 0 && query.page > 1) {
        setPage(query.page - 1);
        return;
      }
      setResult(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
    } finally {
      setLoadedQuery(query);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  // volver a la página 1 cuando cambia la búsqueda
  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    setPage(1);
  }

  const changeCategory = (value: ProductCategory | '') => {
    setCategory(value);
    setPage(1);
  };

  const changeLowStock = (value: boolean) => {
    setLowStock(value);
    setPage(1);
  };

  const toggleSort = (field: ProductSortField) => {
    setSort((current) =>
      current.field === field
        ? { field, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { field, order: field === 'name' ? 'asc' : 'desc' },
    );
    setPage(1);
  };

  const handleSave = async (input: ProductInput) => {
    if (form?.mode === 'edit') {
      const updated = await productService.update(form.product.id, input);
      toast.success(`"${updated.name}" se actualizó correctamente`);
    } else {
      const created = await productService.create(input);
      toast.success(`"${created.name}" se agregó al inventario`);
    }
    setForm(null);
    await load();
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await productService.remove(toDelete.id);
      toast.success(`"${toDelete.name}" se eliminó`);
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo eliminar el producto');
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = Boolean(debouncedSearch || category || lowStock);

  return (
    <>
      <PageHeader
        title="Productos"
        subtitle="Consulta, registra y actualiza el inventario de la tienda."
        actions={
          <button className="btn btn--primary" onClick={() => setForm({ mode: 'create' })}>
            <Icon name="plus" size={16} /> Nuevo producto
          </button>
        }
      />

      <section className="card">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={16} />
            <span className="sr-only">Buscar productos</span>
            <input
              className="input"
              type="search"
              placeholder="Buscar por nombre, SKU o descripción…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            className="input toolbar__select"
            value={category}
            onChange={(e) => changeCategory(e.target.value as ProductCategory | '')}
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="switch">
            <input type="checkbox" checked={lowStock} onChange={(e) => changeLowStock(e.target.checked)} />
            <span className="switch__track" aria-hidden="true" />
            Solo por reponer
          </label>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !result ? (
          <Spinner />
        ) : result.items.length === 0 ? (
          <EmptyState
            title={hasFilters ? 'Sin resultados' : 'Aún no hay productos'}
            description={hasFilters ? 'Prueba con otros filtros de búsqueda.' : 'Registra el primer producto del inventario.'}
          />
        ) : (
          <>
            <div className={`table-wrap ${loading ? 'table-wrap--loading' : ''}`}>
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <SortHeader field="name" label="Producto" sort={sort} onSort={toggleSort} />
                    <th>Categoría</th>
                    <SortHeader field="price" label="Precio" align="end" sort={sort} onSort={toggleSort} />
                    <SortHeader field="stock" label="Stock" align="end" sort={sort} onSort={toggleSort} />
                    <th className="text-end">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((product) => (
                    <tr key={product.id}>
                      <td className="mono nowrap" data-label="SKU">{product.sku}</td>
                      <td className="cell-main">
                        <div className="cell-title">{product.name}</div>
                        {product.description && <div className="cell-sub">{product.description}</div>}
                      </td>
                      <td data-label="Categoría">
                        <span className="tag">{product.category}</span>
                      </td>
                      <td className="text-end tabular nowrap" data-label="Precio">{product.formattedPrice}</td>
                      <td className="text-end" data-label="Stock">
                        <span className={`badge badge--${product.stockStatus}`} title={`Mínimo: ${product.minStock}`}>
                          <span className="tabular">{product.stock}</span> · {product.stockLabel}
                        </span>
                      </td>
                      <td className="text-end nowrap cell-actions">
                        <button
                          className="icon-btn"
                          onClick={() => setForm({ mode: 'edit', product })}
                          aria-label={`Editar ${product.name}`}
                          title="Editar"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        {user?.isAdmin && (
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={() => setToDelete(product)}
                            aria-label={`Eliminar ${product.name}`}
                            title="Eliminar"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination meta={result.meta} onPageChange={setPage} />
          </>
        )}
      </section>

      <Modal
        open={form !== null}
        title={form?.mode === 'edit' ? 'Editar producto' : 'Nuevo producto'}
        description={form?.mode === 'edit' ? form.product.sku : 'Completa los datos del producto.'}
        onClose={() => setForm(null)}
      >
        {form && (
          <ProductForm
            key={form.mode === 'edit' ? form.product.id : 'new'}
            initialValues={form.mode === 'edit' ? productToFormValues(form.product) : undefined}
            submitLabel={form.mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
            onSubmit={handleSave}
            onCancel={() => setForm(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar producto"
        message={
          <>
            ¿Seguro que deseas eliminar <strong>{toDelete?.name}</strong>? Esta acción no se puede deshacer.
          </>
        }
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

interface SortHeaderProps {
  field: ProductSortField;
  label: string;
  align?: 'end';
  sort: { field: ProductSortField; order: 'asc' | 'desc' };
  onSort: (field: ProductSortField) => void;
}

function SortHeader({ field, label, align, sort, onSort }: SortHeaderProps) {
  const active = sort.field === field;
  return (
    <th
      aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={align === 'end' ? 'text-end' : ''}
    >
      <button className={`sort-btn ${active ? 'sort-btn--active' : ''}`} onClick={() => onSort(field)}>
        {label}
        <Icon name={active ? (sort.order === 'asc' ? 'arrowUp' : 'arrowDown') : 'sort'} size={14} />
      </button>
    </th>
  );
}
