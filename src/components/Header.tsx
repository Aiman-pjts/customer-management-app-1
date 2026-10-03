import { Users, LogOut } from "lucide-react";

interface HeaderProps {
  userEmail?: string;
  onLogout?: () => void;
}

export default function Header({ userEmail, onLogout }: HeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      {userEmail && (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {userEmail}
          </span>
          {onLogout && (
            <button
              onClick={onLogout}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-red-600"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
}