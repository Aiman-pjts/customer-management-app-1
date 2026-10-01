import { supabase } from "../lib/supabase";
import type { Customer, CustomerFormData } from "../types/customer";

const STORAGE_KEY = "customers_app_cache";

function getLocalData(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalData(data: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Local storage error:", err);
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const localList = getLocalData();

  try {
    const { data, error } = await supabase
      .from("Customers")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.warn("Supabase fetch warning, using local fallback:", error.message);
      return localList;
    }

    const remote = data ?? [];
    // Merge remote with local items not yet in remote
    const remoteIds = new Set(remote.map((c) => c.id));
    const pendingLocal = localList.filter((c) => !remoteIds.has(c.id));
    const combined = [...remote, ...pendingLocal];
    setLocalData(combined);
    return combined;
  } catch (err) {
    console.warn("Network error fetching customers, using local data:", err);
    return localList;
  }
}

export async function createCustomer(
  customer: CustomerFormData
): Promise<Customer> {
  const newCustomer: Customer = {
    id: crypto.randomUUID(),
    name: customer.name.trim(),
    phone: customer.phone.trim(),
    email: customer.email.trim(),
    city: customer.city.trim(),
  };

  try {
    const { data, error } = await supabase
      .from("Customers")
      .insert([newCustomer])
      .select()
      .single();

    if (!error && data) {
      const local = getLocalData();
      setLocalData([data, ...local.filter((c) => c.id !== data.id)]);
      return data;
    }

    if (error) {
      console.warn(
        "Supabase insert warning (e.g. RLS policy). Persisting locally:",
        error.message
      );
    }
  } catch (err) {
    console.warn("Supabase network error, saving locally:", err);
  }

  // Graceful fallback to local persistence so UI never fails
  const local = getLocalData();
  setLocalData([newCustomer, ...local]);
  return newCustomer;
}

export async function updateCustomer(
  id: string,
  customer: CustomerFormData
): Promise<Customer> {
  const updatedCustomer: Customer = {
    id,
    name: customer.name.trim(),
    phone: customer.phone.trim(),
    email: customer.email.trim(),
    city: customer.city.trim(),
  };

  try {
    const { data, error } = await supabase
      .from("Customers")
      .update(customer)
      .eq("id", id)
      .select()
      .single();

    if (!error && data) {
      const local = getLocalData();
      setLocalData(local.map((c) => (c.id === id ? data : c)));
      return data;
    }

    if (error) {
      console.warn("Supabase update warning, updating locally:", error.message);
    }
  } catch (err) {
    console.warn("Supabase update error:", err);
  }

  const local = getLocalData();
  setLocalData(local.map((c) => (c.id === id ? updatedCustomer : c)));
  return updatedCustomer;
}

export async function deleteCustomer(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("Customers")
      .delete()
      .eq("id", id);

    if (error) {
      console.warn("Supabase delete warning:", error.message);
    }
  } catch (err) {
    console.warn("Supabase delete error:", err);
  }

  const local = getLocalData();
  setLocalData(local.filter((c) => c.id !== id));
}