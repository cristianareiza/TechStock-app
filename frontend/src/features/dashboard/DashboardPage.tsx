import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/layout/AppLayout';
import { Icon, type IconName } from '../../components/ui/Icon';
import { ErrorState, Spinner } from '../../components/ui/States';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../core/http/ApiError';
import { formatCurrency, formatNumber } from '../../models/formatters';
import type { Product } from '../../models/Product';
import type { ProductStats } from '../../models/types';
import { productService } from '../../services';

interface DashboardData {
  stats: ProductStats;
  lowStock: Product[];
}

function StatCard({ icon, label, value, tone }: { icon: IconName; label: string; value: string; tone?: 'warn' }) {
  return (
    <article className={`stat-card ${tone ? `stat-card--${tone}` : ''}`}>
      <span className="stat-card__icon">
        <Icon name={icon} size={18} />
      </span>
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value">{value}</p>
    </article>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [stats, lowStock] = await Promise.all([
        productService.getStats(),
        productService.search({ lowStock: true, sort: 'stock', order: 'asc', limit: 6 }),
      ]);
      setData({ stats, lowStock: lowStock.items });
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxUnits = Math.max(1, ...(data?.stats.byCategory.map((c) => c.units) ?? [1]));

  return (
    <>
      <PageHeader
        title={`Hola, ${user?.firstName ?? ''}`}
        subtitle="Este es el estado actual de tu inventario."
        actions={
          <Link to="/productos" className="btn btn--primary">
            <Icon name="box" size={16} /> Ver productos
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}
      {!error && !data && <Spinner />}

      {data && (
        <>
          <section className="stats-grid" aria-label="Resumen">
            <StatCard icon="box" label="Productos registrados" value={formatNumber(data.stats.totalProducts)} />
            <StatCard icon="layers" label="Unidades en bodega" value={formatNumber(data.stats.totalUnits)} />
            <StatCard icon="coins" label="Valor del inventario" value={formatCurrency(data.stats.inventoryValue)} />
            <StatCard
              icon="alert"
              label="Requieren reposición"
              value={`${data.stats.lowStockCount}`}
              tone={data.stats.lowStockCount > 0 ? 'warn' : undefined}
            />
          </section>

          <div className="dashboard-grid">
            <section className="card">
              <header className="card__header">
                <h2>Unidades por categoría</h2>
              </header>
              <ul className="bar-list">
                {data.stats.byCategory.map((row) => (
                  <li key={row.category}>
                    <div className="bar-list__label">
                      <span>{row.category}</span>
                      <span className="muted tabular">
                        {formatNumber(row.units)} u · {row.products} prod.
                      </span>
                    </div>
                    <div className="bar-list__track">
                      <div className="bar-list__fill" style={{ width: `${(row.units / maxUnits) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card">
              <header className="card__header">
                <h2>Stock por reponer</h2>
                <Link to="/productos?stock=bajo" className="link">
                  Ver todos
                </Link>
              </header>
              {data.lowStock.length === 0 ? (
                <p className="muted card__empty">Todo el inventario está por encima del mínimo.</p>
              ) : (
                <ul className="restock-list">
                  {data.lowStock.map((product) => (
                    <li key={product.id}>
                      <div>
                        <strong>{product.name}</strong>
                        <span className="mono muted">{product.sku}</span>
                      </div>
                      <span className={`badge badge--${product.stockStatus}`}>
                        {product.stock} / mín. {product.minStock}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
