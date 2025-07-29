import { searchMocks } from './__fixtures__/search';
import { SearchBar } from './search-bar';
import { fetchSuggestions } from '@/db/data/suggestions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, fireEvent, render } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { vi, test, expect, afterEach, beforeEach } from 'vitest';

vi.mock(import('next/navigation'));
vi.mock(import('@/db/data/suggestions'));

const mockRouter = {
  push: vi.fn(),
  prefetch: vi.fn(),
};

async function mockFetchSuggestions(q: string) {
  return Promise.resolve(searchMocks[q.toLocaleLowerCase()] ?? []);
}

beforeEach(() => {
  vi.mocked(fetchSuggestions).mockImplementation(mockFetchSuggestions);
  vi.mocked(useRouter, { partial: true }).mockReturnValue(mockRouter);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('loading spinner', async () => {
  customRender(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'blah' } });
  expect(await screen.findByTestId('loading-spinner')).toBeVisible();
});

test('no results', async () => {
  customRender(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'blah' } });
  expect(await screen.findByText(/No TV Shows Found./i)).toBeInTheDocument();
});

test('error message', async () => {
  vi.mocked(fetchSuggestions).mockRejectedValue(new Error());
  customRender(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'blah' } });
  expect(
    await screen.findByText(/something went wrong. please try again./i),
  ).toBeInTheDocument();
});

test('keyboard navigation', async () => {
  customRender(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'Avatar' } });
  await screen.findAllByText(/Avatar: The Last Airbender/i);
  fireEvent.keyDown(searchBar, { key: 'ArrowDown' });
  fireEvent.keyDown(searchBar, { key: 'Enter' });

  // Verify redirect
  await vi.waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledExactlyOnceWith(
      '/ratings?id=tt0417299',
    );
  });
});

test('mouse navigation', async () => {
  customRender(<SearchBar />);

  const searchBar = await screen.findByRole('combobox');
  fireEvent.change(searchBar, { target: { value: 'the sopranos' } });
  const dropdownOption = await screen.findByText(/the sopranos/i);
  expect(dropdownOption).toBeVisible();
  fireEvent.click(dropdownOption);

  // Verify redirect
  await vi.waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledExactlyOnceWith(
      '/ratings?id=tt0141842',
    );
  });
});

function customRender(children: React.ReactElement) {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
            },
          },
        })
      }
    >
      {children}
    </QueryClientProvider>,
  );
}
