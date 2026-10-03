"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import Header from "@/components/Header";
import CustomerForm from "@/components/CustomerForm";
import CustomerList from "@/components/CustomerList";
import DeleteModal from "@/components/DeleteModal";
import Pagination from "@/components/Pagination";

import type { Customer, CustomerFormData } from "@/types/customer";
import { supabase } from "@/lib/supabase/client";
import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  getLocalCustomerCache,
  subscribeToUserCustomers,
  updateCustomer,
} from "@/services/customerService";

const PAGE_SIZE = 10;

export default function CustomersDashboardPage() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Customer State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Form & Modal States
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Operation Loading & Feedback States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 1. Check Authenticated Session
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setCurrentUser(user);

        // Instantly populate from local cache if available
        const cached = getLocalCustomerCache(user.id);
        if (cached && cached.length > 0) {
          setCustomers(cached);
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("Auth verification error:", err);
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    }

    checkAuth();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setCurrentUser(session.user);
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [router]);

  // 2. Fetch fresh customers from Supabase & Setup Realtime Subscription
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;

    async function loadFreshCustomers() {
      try {
        setLoading(true);
        setError("");

        const remoteData = await getCustomers(currentUser!.id);
        if (isMounted) {
          setCustomers(remoteData);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error("Failed to load customers from Supabase:", err);
          const message =
            err instanceof Error ? err.message : "Unable to load customers from Supabase.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadFreshCustomers();

    // Subscribe to Realtime events for this user's records
    const unsubscribe = subscribeToUserCustomers(currentUser.id, (event) => {
      if (!isMounted) return;

      if (event.eventType === "INSERT") {
        setCustomers((prev) => {
          if (prev.some((c) => c.id === event.new.id)) {
            return prev;
          }
          return [event.new, ...prev];
        });
      } else if (event.eventType === "UPDATE") {
        setCustomers((prev) =>
          prev.map((c) => (c.id === event.new.id ? event.new : c))
        );
      } else if (event.eventType === "DELETE") {
        setCustomers((prev) => prev.filter((c) => c.id !== event.old.id));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser]);

  // Handle Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // 3. Add or Update Customer (Direct Supabase CRUD)
  async function handleSubmit(data: CustomerFormData) {
    if (!currentUser) {
      setError("You must be logged in to perform this action.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      if (editingCustomer) {
        // UPDATE in Supabase
        const updated = await updateCustomer(editingCustomer.id, data, currentUser.id);

        setCustomers((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );

        setEditingCustomer(null);
        setSuccessMessage("Customer updated successfully in Supabase.");
      } else {
        // INSERT into Supabase
        const created = await createCustomer(data, currentUser.id);

        setCustomers((prev) => {
          if (prev.some((c) => c.id === created.id)) {
            return prev;
          }
          return [created, ...prev];
        });

        setSuccessMessage("Customer added successfully to Supabase.");
      }
    } catch (err: unknown) {
      console.error("Save customer error:", err);
      const message =
        err instanceof Error ? err.message : "Unable to save customer to Supabase.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Edit Customer
  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setError("");
    setSuccessMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Delete Customer (Direct Supabase Deletion)
  async function handleDelete() {
    if (!deletingCustomer || !currentUser) {
      return;
    }

    try {
      setDeleting(true);
      setError("");
      setSuccessMessage("");

      await deleteCustomer(deletingCustomer.id, currentUser.id);

      setCustomers((prev) => prev.filter((c) => c.id !== deletingCustomer.id));
      setSuccessMessage("Customer deleted successfully from Supabase.");
      setDeletingCustomer(null);
    } catch (err: unknown) {
      console.error("Delete customer error:", err);
      const message =
        err instanceof Error ? err.message : "Unable to delete customer from Supabase.";
      setError(message);
    } finally {
      setDeleting(false);
    }
  }

  // Extract list of unique cities for filtering
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.city && c.city.trim()) {
        set.add(c.city.trim());
      }
    });
    return Array.from(set).sort();
  }, [customers]);

  // Filtered customers (search query + city filter)
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return customers.filter((customer) => {
      const matchesSearch =
        !q ||
        customer.name.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        customer.city.toLowerCase().includes(q);

      const matchesCity =
        !selectedCity ||
        customer.city.toLowerCase() === selectedCity.toLowerCase();

      return matchesSearch && matchesCity;
    });
  }, [customers, searchTerm, selectedCity]);

  // Reset pagination when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCity]);

  // Paginated customers for current page
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-500">Checking authentication...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Header
          userEmail={currentUser?.email}
          onLogout={handleLogout}
        />

        {/* Success message banner */}
        {successMessage && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-base font-semibold leading-none text-emerald-700 hover:text-emerald-900"
              aria-label="Dismiss success message"
            >
              ×
            </button>
          </div>
        )}

        {/* Error message banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-base font-semibold leading-none text-red-700 hover:text-red-900"
              aria-label="Dismiss error message"
            >
              ×
            </button>
          </div>
        )}

        {/* Customer Form */}
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditingCustomer(null);
            setError("");
          }}
          isSubmitting={submitting}
        />

        {/* Customer List with Search & Filtering */}
        <CustomerList
          customers={paginatedCustomers}
          totalCustomerCount={filteredCustomers.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          cities={uniqueCities}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          onEdit={handleEdit}
          onDelete={(customer) => {
            setDeletingCustomer(customer);
            setError("");
          }}
          pagination={
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCustomers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          }
        />

        {/* Loading Indicator */}
        {loading && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Loading customers from Supabase...
          </p>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteModal
          customer={deletingCustomer}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCustomer(null)}
          isDeleting={deleting}
        />
      </div>
    </main>
  );
}

