import { MapPin, Pencil, Trash2 } from "lucide-react";
import type { Customer } from "../types/customer";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function CustomerTable({
  customers,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Customer
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Phone
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </th>

            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              City
            </th>

            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="transition-colors hover:bg-slate-50"
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {getInitials(customer.name)}
                  </div>

                  <span className="font-medium text-slate-800">
                    {customer.name}
                  </span>
                </div>
              </td>

              <td className="px-5 py-4 text-sm text-slate-600">
                {customer.phone}
              </td>

              <td className="px-5 py-4 text-sm text-slate-600">
                {customer.email}
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {customer.city}
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(customer)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                    aria-label={`Edit ${customer.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(customer)}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${customer.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}