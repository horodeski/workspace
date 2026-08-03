import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HistoryList } from '../components/HistoryList';
import type { WeekHistoryItem } from '../types/review.types';

function renderHistoryList(items: WeekHistoryItem[]) {
  return render(
    <MemoryRouter>
      <HistoryList items={items} />
    </MemoryRouter>
  );
}

describe('HistoryList', () => {
  const sampleItems: WeekHistoryItem[] = [
    { weekNumber: 30, year: 2025, hasReview: true, isLocked: true },
    { weekNumber: 29, year: 2025, hasReview: false, isLocked: false },
    { weekNumber: 52, year: 2024, hasReview: true, isLocked: true },
    { weekNumber: 51, year: 2024, hasReview: false, isLocked: false },
  ];

  it('renders year headings for each group', () => {
    renderHistoryList(sampleItems);

    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('renders year headings in descending order', () => {
    renderHistoryList(sampleItems);

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings[0]).toHaveTextContent('2025');
    expect(headings[1]).toHaveTextContent('2024');
  });

  it('renders checkmark (✔) for items with hasReview=true', () => {
    renderHistoryList([
      { weekNumber: 30, year: 2025, hasReview: true, isLocked: true },
    ]);

    expect(screen.getByText('✔')).toBeInTheDocument();
  });

  it('renders circle (○) for items with hasReview=false', () => {
    renderHistoryList([
      { weekNumber: 29, year: 2025, hasReview: false, isLocked: false },
    ]);

    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('renders "Semana {weekNumber}" labels', () => {
    renderHistoryList(sampleItems);

    expect(screen.getByText('Semana 30')).toBeInTheDocument();
    expect(screen.getByText('Semana 29')).toBeInTheDocument();
    expect(screen.getByText('Semana 52')).toBeInTheDocument();
    expect(screen.getByText('Semana 51')).toBeInTheDocument();
  });

  it('renders links pointing to correct routes', () => {
    renderHistoryList(sampleItems);

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/weekly-review/2025/30');
    expect(links[1]).toHaveAttribute('href', '/weekly-review/2025/29');
    expect(links[2]).toHaveAttribute('href', '/weekly-review/2024/52');
    expect(links[3]).toHaveAttribute('href', '/weekly-review/2024/51');
  });

  it('groups items correctly under their year heading', () => {
    renderHistoryList(sampleItems);

    const section = screen.getByRole('region', { name: 'Histórico de revisões' });
    const groups = within(section).getAllByRole('list');

    // First group (2025) has 2 items
    const year2025Items = within(groups[0]).getAllByRole('listitem');
    expect(year2025Items).toHaveLength(2);

    // Second group (2024) has 2 items
    const year2024Items = within(groups[1]).getAllByRole('listitem');
    expect(year2024Items).toHaveLength(2);
  });

  it('renders empty state when no items provided', () => {
    const { container } = renderHistoryList([]);

    const lists = container.querySelectorAll('ul');
    expect(lists).toHaveLength(0);
  });
});
