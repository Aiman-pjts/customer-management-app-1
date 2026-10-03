"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  User as UserIcon,
} from "lucide-react";

import Header from "@/components/Header";
import CustomerForm from "@/components/CustomerForm";
import DeleteModal from "@/components/DeleteModal";

import type { Customer, CustomerFormData } from "@/types/customer";
import { supabase } from "@/lib/supabase/client";
import {
  deleteCustomer,
  getCustomerById,
  updateCustomer,
} from "@/services/customerService";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);
        const data = await getCustomerById(customerId, user.id);
        setCustomer(data);
      } catch (err: unknown) {
        console.error("Error fetching customer details:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Customer not found or unauthorized access.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (customerId) {
      loadCustomer();
    }
  }, [customerId, router]);

  async function handleUpdate(data: CustomerFormData) {
    if (!userId || !customer) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      const updated = await updateCustomer(customer.id, data, userId);
      setCustomer(updated);
      setIsEditing(false);
      setSuccessMessage("Customer updated successfully.");
    } catch (err: unknown) {
      console.error("Error updating customer:", err);
      const message =
        err instanceof Error ? err.message : "Failed to update customer.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!userId || !customer) return;

    try {
      setDeleting(true);
      setError("");

      await deleteCustomer(customer.id, userId);
      router.push("/customers");
    } catch (err: unknown) {
      console.error("Error deleting customer:", err);
      const message =
        err instanceof Error ? err.message : "Failed to delete customer.";
      setError(message);
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Header />

        <div className="mb-6">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>
        </div>

        {/* Success message banner */}
        {successMessage && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              className="text-base font-semibold leading-none text-emerald-700 hover:text-emerald-900"
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
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
            Loading customer details...
          </div>
        ) : !customer ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
            Customer details could not be found.
          </div>
        ) : isEditing ? (
          <CustomerForm
            customer={customer}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={submitting}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/50 p-6 sm:flex sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                  {customer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {customer.name}
                  </h2>
                  <p className="text-sm text-slate-500">ID: {customer.id}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2 sm:mt-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Customer Name
                  </span>
                  <p className="mt-1 font-medium text-slate-800">
                    {customer.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Phone Number
                  </span>
                  <p className="mt-1 font-medium text-slate-800">
                    {customer.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Email Address
                  </span>
                  <p className="mt-1 font-medium text-slate-800">
                    {customer.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    City
                  </span>
                  <p className="mt-1 font-medium text-slate-800">
                    {customer.city}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Created At
                  </span>
                  <p className="mt-1 text-sm text-slate-700">
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Last Updated
                  </span>
                  <p className="mt-1 text-sm text-slate-700">
                    {customer.updated_at
                      ? new Date(customer.updated_at).toLocaleString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DeleteModal
          customer={showDeleteModal ? customer : null}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={deleting}
        />
      </div>
    </main>
  );
}

