import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Minha Rotina" />);
    expect(
      screen.getByRole('heading', { name: 'Minha Rotina' })
    ).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(
      <PageHeader
        title="Journal"
        description="Registre o que você fez hoje"
      />
    );
    expect(
      screen.getByText('Registre o que você fez hoje')
    ).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<PageHeader title="Inbox" />);
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(0);
  });

  it('renders actions when provided', () => {
    render(
      <PageHeader
        title="Rotina"
        actions={<button>Nova Rotina</button>}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Nova Rotina' })
    ).toBeInTheDocument();
  });

  it('does not render actions area when actions are not provided', () => {
    const { container } = render(<PageHeader title="Dashboard" />);
    const actionGroup = container.querySelector('[role="group"]');
    expect(actionGroup).not.toBeInTheDocument();
  });
});
