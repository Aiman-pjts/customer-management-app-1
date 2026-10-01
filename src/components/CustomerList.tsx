import type { Customer } from "../types/customer";
import SearchBar from "./SearchBar";
import CustomerTable from "./CustomerTable";
import EmptyState from "./EmptyState";

interface CustomerListProps {
  customers: Customer[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export default function CustomerList({
  customers,
  searchTerm,
  onSearchChange,
  onEdit,
  onDelete,
}: CustomerListProps) {
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
            {customers.length}{" "}
            {customers.length === 1 ? "Customer" : "Customers"}
          </span>
        </div>

        <div className="mt-5">
          <SearchBar
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      {customers.length > 0 ? (
        <CustomerTable
          customers={customers}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <EmptyState
          message="No customers found"
          description={
            searchTerm
              ? "Try adjusting your search."
              : "Add your first customer to start managing your customer records."
          }
        />
      )}
    </section>
  );
}