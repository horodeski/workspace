import { render, screen } from '@testing-library/react';

function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}</h1>;
}

describe('React Testing Library setup', () => {
  it('should render a React component', () => {
    render(<Greeting name="Work Journal" />);
    expect(screen.getByText('Hello, Work Journal')).toBeInTheDocument();
  });
});
