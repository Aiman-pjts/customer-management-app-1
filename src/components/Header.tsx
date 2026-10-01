import { Users } from "lucide-react";

export default function Header() {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          <Users className="h-5 w-5" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Customer Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your customers and keep their contact information organized
            in one place.
          </p>
        </div>
      </div>
    </header>
  );
}