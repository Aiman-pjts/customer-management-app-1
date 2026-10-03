import type { ReactNode } from "react";
import type { Customer } from "../types/customer";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import CustomerTable from "./CustomerTable";
import EmptyState from "./EmptyState";

interface CustomerListProps {
  customers: Customer[];
  totalCustomerCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  cities?: string[];
  selectedCity?: string;
  onCityChange?: (city: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  pagination?: ReactNode;
}

export default function CustomerList({
  customers,
  totalCustomerCount,
  searchTerm,
  onSearchChange,
  cities = [],
  selectedCity = "",
  onCityChange,
  onEdit,
  onDelete,
  pagination,
}: CustomerListProps) {
  const isFiltering = searchTerm.trim().length > 0 || selectedCity.length > 0;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Customers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage your customer records
            </p>
          </div>

          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {totalCustomerCount}{" "}
            {totalCustomerCount === 1 ? "Customer" : "Customers"}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={onSearchChange}
            />
          </div>

          {cities.length > 0 && onCityChange && (
            <FilterBar
              cities={cities}
              selectedCity={selectedCity}
              onCityChange={onCityChange}
            />
          )}
        </div>
      </div>

      {customers.length > 0 ? (
        <>
          <CustomerTable
            customers={customers}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {pagination}
        </>
      ) : (
        <EmptyState
          message={
            isFiltering || totalCustomerCount > 0
              ? "No customers match your search."
              : "No customers found"
          }
          description={
            isFiltering || totalCustomerCount > 0
              ? "Try adjusting your search terms or city filter."
              : "Add your first customer to start managing your customer records."
          }
        />
      )}
    </section>
  );
}