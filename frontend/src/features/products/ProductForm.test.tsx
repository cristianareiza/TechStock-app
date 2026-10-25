import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../core/http/ApiError';
import { ProductForm } from './ProductForm';

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  render(<ProductForm submitLabel="Crear producto" onSubmit={onSubmit} onCancel={vi.fn()} />);
  return { onSubmit, user: userEvent.setup() };
}

describe('<ProductForm />', () => {
  it('muestra errores y no envía si el formulario está incompleto', async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(screen.getByText('El SKU es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('Selecciona una categoría')).toBeInTheDocument();
    expect(screen.getByLabelText('SKU')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía los datos convertidos cuando son válidos', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText('SKU'), 'mon-777');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Monitores');
    await user.type(screen.getByLabelText('Nombre'), 'Monitor 27"');
    await user.type(screen.getByLabelText('Precio (COP)'), '899000');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(onSubmit).toHaveBeenCalledWith({
      sku: 'MON-777',
      name: 'Monitor 27"',
      description: '',
      category: 'Monitores',
      price: 899000,
      stock: 0,
      minStock: 5,
    });
  });

  it('muestra el mensaje del servidor si la API rechaza el producto', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, 'Ya existe un producto con el SKU MON-777'));
    const { user } = renderForm(onSubmit);

    await user.type(screen.getByLabelText('SKU'), 'MON-777');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Monitores');
    await user.type(screen.getByLabelText('Nombre'), 'Monitor');
    await user.type(screen.getByLabelText('Precio (COP)'), '1000');
    await user.click(screen.getByRole('button', { name: 'Crear producto' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un producto con el SKU MON-777');
  });
});
