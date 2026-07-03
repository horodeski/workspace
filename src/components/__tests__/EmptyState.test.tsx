import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="Nenhuma rotina"
        description="Crie sua primeira rotina para começar"
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Nenhuma rotina' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Crie sua primeira rotina para começar')
    ).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        icon={<svg data-testid="empty-icon" />}
        title="Vazio"
        description="Nada aqui ainda"
      />
    );
    expect(screen.getByTestId('empty-icon')).toBeInTheDocument();
  });

  it('does not render icon area when icon is not provided', () => {
    const { container } = render(
      <EmptyState title="Vazio" description="Nada aqui" />
    );
    const iconWrapper = container.querySelector('[aria-hidden="true"]');
    expect(iconWrapper).not.toBeInTheDocument();
  });

  it('renders action button and triggers onClick', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="Sem entradas"
        description="Comece a registrar"
        action={{ label: 'Criar entrada', onClick: handleClick }}
      />
    );
    const button = screen.getByRole('button', { name: 'Criar entrada' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when action is not provided', () => {
    render(
      <EmptyState title="Vazio" description="Nada para mostrar" />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has accessible role and label', () => {
    render(
      <EmptyState title="Lista vazia" description="Adicione itens" />
    );
    expect(
      screen.getByRole('status', { name: 'Lista vazia' })
    ).toBeInTheDocument();
  });
});
