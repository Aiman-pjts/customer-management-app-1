import { supabase } from "../lib/supabase/client";
import type { Customer, CustomerFormData } from "../types/customer";

export const CACHE_PREFIX = "customer_cache_";

export function getLocalCustomerCache(userId: string): Customer[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalCustomerCache(userId: string, customers: Customer[]): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(`${CACHE_PREFIX}${userId}`, JSON.stringify(customers));
  } catch (err) {
    console.error("Failed to update localStorage customer cache:", err);
  }
}

export function updateLocalCustomerInCache(userId: string, updated: Customer): void {
  const current = getLocalCustomerCache(userId);
  const next = current.map((c) => (c.id === updated.id ? updated : c));
  setLocalCustomerCache(userId, next);
}

export function removeLocalCustomerFromCache(userId: string, customerId: string): void {
  const current = getLocalCustomerCache(userId);
  const next = current.filter((c) => c.id !== customerId);
  setLocalCustomerCache(userId, next);
}

export function addLocalCustomerToCache(userId: string, newCustomer: Customer): void {
  const current = getLocalCustomerCache(userId);
  const next = [newCustomer, ...current.filter((c) => c.id !== newCustomer.id)];
  setLocalCustomerCache(userId, next);
}

export async function getCustomers(userId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Table 'customers' not found in Supabase. Please run the migration 'supabase/migrations/001_create_customers.sql' in your Supabase SQL Editor."
      );
    }
    throw new Error(error.message);
  }

  const list = (data as Customer[]) ?? [];
  setLocalCustomerCache(userId, list);
  return list;
}

export async function getCustomerById(id: string, userId: string): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Customer;
}

export async function createCustomer(
  formData: CustomerFormData,
  userId: string
): Promise<Customer> {
  const payload = {
    user_id: userId,
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim(),
    city: formData.city.trim(),
  };

  const { data, error } = await supabase
    .from("customers")
    .insert([payload])
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST205") {
      throw new Error(
        "Table 'customers' not found in Supabase. Please run the migration 'supabase/migrations/001_create_customers.sql' in your Supabase SQL Editor."
      );
    }
    throw new Error(error.message);
  }

  const newCustomer = data as Customer;
  addLocalCustomerToCache(userId, newCustomer);
  return newCustomer;
}

export async function updateCustomer(
  id: string,
  formData: CustomerFormData,
  userId: string
): Promise<Customer> {
  const payload = {
    name: formData.name.trim(),
    phone: formData.phone.trim(),
    email: formData.email.trim(),
    city: formData.city.trim(),
  };

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const updatedCustomer = data as Customer;
  updateLocalCustomerInCache(userId, updatedCustomer);
  return updatedCustomer;
}

export async function deleteCustomer(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  removeLocalCustomerFromCache(userId, id);
}

export type RealtimeCustomerEvent =
  | { eventType: "INSERT"; new: Customer }
  | { eventType: "UPDATE"; new: Customer }
  | { eventType: "DELETE"; old: { id: string } };

export function subscribeToUserCustomers(
  userId: string,
  onEvent: (event: RealtimeCustomerEvent) => void
): () => void {
  const channel = supabase
    .channel(`customers-channel-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "customers",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT") {
          const newCustomer = payload.new as Customer;
          addLocalCustomerToCache(userId, newCustomer);
          onEvent({ eventType: "INSERT", new: newCustomer });
        } else if (payload.eventType === "UPDATE") {
          const updatedCustomer = payload.new as Customer;
          updateLocalCustomerInCache(userId, updatedCustomer);
          onEvent({ eventType: "UPDATE", new: updatedCustomer });
        } else if (payload.eventType === "DELETE") {
          const oldData = payload.old as { id: string };
          removeLocalCustomerFromCache(userId, oldData.id);
          onEvent({ eventType: "DELETE", old: oldData });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export const subscribeToCustomers = subscribeToUserCustomers;
