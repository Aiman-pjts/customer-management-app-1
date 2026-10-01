import { Users } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export default function EmptyState({
  message = "No customers found",
  description = "Add your first customer to start managing your customer records.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Users className="h-6 w-6 text-slate-400" />
      </div>

      <h3 className="text-base font-semibold text-slate-800">
        {message}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}