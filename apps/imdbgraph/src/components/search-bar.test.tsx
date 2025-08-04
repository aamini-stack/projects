import { searchMocks } from './__fixtures__/search';
import { SearchBar } from './search-bar';
import { screen, fireEvent, render } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import { ActionError } from 'astro:actions';

vi.mock('astro:actions', () => ({
  actions: {
    fetchSuggestions: mockFetchSuggestions,
  },
}));

test('loading spinner', async () => {
  render(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'blah' } });
  expect(await screen.findByTestId('loading-spinner')).toBeVisible();
});

test('no results', async () => {
  render(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'blah' } });
  expect(await screen.findByText(/No TV Shows Found./i)).toBeInTheDocument();
});

test('error message', async () => {
  render(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'error' } });
  expect(
    await screen.findByText(
      /Something went wrong. Please try again./i,
      {},
      { timeout: 20_000 },
    ),
  ).toBeInTheDocument();
}, 20_000);

function mockFetchSuggestions({ query }: { query: string }) {
  if (query === 'error') {
    return Promise.resolve({
      error: new ActionError({
        code: 'INTERNAL_SERVER_ERROR',
      }),
    });
  } else {
    return Promise.resolve({
      data: searchMocks[query.toLocaleLowerCase()] ?? [],
    });
  }
}
