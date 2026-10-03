import { Filter } from "lucide-react";

interface FilterBarProps {
  cities: string[];
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export default function FilterBar({
  cities,
  selectedCity,
  onCityChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-slate-400 shrink-0" />
      <select
        value={selectedCity}
        onChange={(e) => onCityChange(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        aria-label="Filter by City"
      >
        <option value="">All Cities</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </div>
  );
}

