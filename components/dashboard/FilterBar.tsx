import React from 'react';
import { Search, X, Filter, ArrowUpDown } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  filter: string;
  setFilter: (f: any) => void;
  sort: string;
  setSort: (s: any) => void;
  count: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  filter,
  setFilter,
  sort,
  setSort,
  count
}) => {
  return (
    <div className="px-4 py-2 flex items-center gap-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
      {/* Search Input */}
      <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100 min-w-[140px]">
        <Search size={14} className="text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="text-xs font-bold text-gray-600 bg-transparent outline-none w-full placeholder-gray-300"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
            <X size={12} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
        <Filter size={14} className="text-gray-400" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-xs font-bold text-gray-600 bg-transparent outline-none cursor-pointer"
        >
          <option value="ALL">All Topics</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="MASTERED">Mastered</option>
        </select>
      </div>

      <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
        <ArrowUpDown size={14} className="text-gray-400" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="text-xs font-bold text-gray-600 bg-transparent outline-none cursor-pointer"
        >
          <option value="DEFAULT">Path Order</option>
          <option value="NAME">Name (A-Z)</option>
          <option value="LEVEL">Level (High-Low)</option>
        </select>
      </div>

      <div className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-wider">
        {count} Topics
      </div>
    </div>
  );
};