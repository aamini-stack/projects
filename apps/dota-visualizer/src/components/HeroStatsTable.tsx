import { Hero } from '@/lib/dota/hero';
import React from 'react';

export interface TableColumn<Hero> {
  header: string;
  key: keyof Hero;
  render?: (item: Hero) => React.ReactNode;
}

export function HeroStatsTable({
  data,
  columns,
}: {
  data: Hero[];
  columns: TableColumn<Hero>[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-800 text-white">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className="border-b border-gray-700 px-4 py-2 text-left"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-700">
              {columns.map((column) => (
                <td
                  key={column.header + String(item[column.key])}
                  className="border-b border-gray-700 px-4 py-2"
                >
                  {column.render
                    ? column.render(item)
                    : String(item[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
