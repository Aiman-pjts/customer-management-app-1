import { useEffect, useState } from "react";

import Header from "../components/Header";
import CustomerForm from "../components/CustomerForm";
import CustomerList from "../components/CustomerList";
import DeleteModal from "../components/DeleteModal";

import type {
  Customer,
  CustomerFormData,
} from "../types/customer";

import {
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "../services/CustomerServices";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load customers from Supabase
  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers();

      setCustomers(data);
    } catch (err: unknown) {
      console.error("Error loading customers:", err);
      const message =
        err instanceof Error ? err.message : "Unable to load customers.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Load customers when page opens
  useEffect(() => {
    loadCustomers();
  }, []);

  // Add or update customer
  async function handleSubmit(data: CustomerFormData) {
    try {
      setError("");

      if (editingCustomer) {
        // UPDATE
        const updatedCustomer = await updateCustomer(
          editingCustomer.id,
          data
        );

        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === updatedCustomer.id
              ? updatedCustomer
              : customer
          )
        );

        setEditingCustomer(null);
      } else {
        // CREATE
        const newCustomer = await createCustomer(data);

        setCustomers((prev) => [
          newCustomer,
          ...prev,
        ]);
      }
    } catch (err: unknown) {
      console.error("Error saving customer:", err);
      const message =
        err instanceof Error ? err.message : "Unable to save customer.";
      setError(message);
    }
  }

  // Edit customer
  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Delete customer
  async function handleDelete() {
    if (!deletingCustomer) {
      return;
    }

    try {
      setError("");

      await deleteCustomer(deletingCustomer.id);

      setCustomers((prev) =>
        prev.filter(
          (customer) =>
            customer.id !== deletingCustomer.id
        )
      );

      setDeletingCustomer(null);
    } catch (err: unknown) {
      console.error("Error deleting customer:", err);
      const message =
        err instanceof Error ? err.message : "Unable to delete customer.";
      setError(message);
    }
  }

  // Search customers
  const filteredCustomers = customers.filter(
    (customer) => {
      const search = searchTerm
        .toLowerCase()
        .trim();

      return (
        customer.name
          .toLowerCase()
          .includes(search) ||
        customer.phone
          .toLowerCase()
          .includes(search) ||
        customer.email
          .toLowerCase()
          .includes(search) ||
        customer.city
          .toLowerCase()
          .includes(search)
      );
    }
  );

  return (
    <>
      <Header />

      {/* Error message */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Customer Form */}
      <CustomerForm
        customer={editingCustomer}
        onSubmit={handleSubmit}
        onCancel={() => setEditingCustomer(null)}
      />

      {/* Customer List */}
      <CustomerList
        customers={filteredCustomers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEdit={handleEdit}
        onDelete={setDeletingCustomer}
      />

      {/* Loading */}
      {loading && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Loading customers...
        </p>
      )}

      {/* Delete Confirmation */}
      <DeleteModal
        customer={deletingCustomer}
        onConfirm={handleDelete}
        onCancel={() => setDeletingCustomer(null)}
      />
    </>
  );
}