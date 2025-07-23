import { SearchBar } from '@/components/search-bar';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center gap-9 pt-20">
      <h1 className="inline text-balance px-8 text-center text-6xl font-semibold tracking-tight lg:text-6xl">
        Welcome to IMDB Graph
      </h1>
      <div className="min-w-sm flex w-full max-w-lg justify-center px-8">
        <SearchBar autoFocus />
      </div>
    </div>
  );
}
