import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ItemForm } from '../components/ItemForm';

describe('ItemForm', () => {
  const onSubmit = jest.fn();
  const onCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render content textarea and type select in create mode', () => {
    render(<ItemForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Conteúdo')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /salvar/i })
    ).toBeInTheDocument();
  });

  it('should render cancel button when onCancel is provided', () => {
    render(<ItemForm onSubmit={onSubmit} onCancel={onCancel} />);

    expect(
      screen.getByRole('button', { name: /cancelar/i })
    ).toBeInTheDocument();
  });

  it('should not render cancel button when onCancel is not provided', () => {
    render(<ItemForm onSubmit={onSubmit} />);

    expect(
      screen.queryByRole('button', { name: /cancelar/i })
    ).not.toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', () => {
    render(<ItemForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should pre-populate fields in edit mode', () => {
    render(
      <ItemForm
        onSubmit={onSubmit}
        defaultValues={{ content: 'Minha citação', type: 'quote' }}
      />
    );

    const textarea = screen.getByLabelText('Conteúdo');
    expect(textarea).toHaveValue('Minha citação');
  });

  it('should show validation error for empty content on submit', async () => {
    render(<ItemForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(
        screen.getByText('O conteúdo é obrigatório')
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for whitespace-only content on submit', async () => {
    render(
      <ItemForm
        onSubmit={onSubmit}
        defaultValues={{ content: '   ', type: 'note' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(
        screen.getByText('O conteúdo não pode conter apenas espaços')
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for content exceeding 500 characters', async () => {
    render(
      <ItemForm
        onSubmit={onSubmit}
        defaultValues={{ content: 'A'.repeat(501), type: 'quote' }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(
        screen.getByText('O conteúdo deve ter no máximo 500 caracteres')
      ).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error when type is not selected', async () => {
    render(<ItemForm onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText('Conteúdo');
    fireEvent.change(textarea, { target: { value: 'Algum conteúdo válido' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText('Selecione um tipo')).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with valid data in edit mode', async () => {
    render(
      <ItemForm
        onSubmit={onSubmit}
        defaultValues={{ content: 'Conteúdo original', type: 'link' }}
      />
    );

    const textarea = screen.getByLabelText('Conteúdo');
    fireEvent.change(textarea, { target: { value: 'Conteúdo atualizado' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { content: 'Conteúdo atualizado', type: 'link' },
        expect.anything()
      );
    });
  });
});
