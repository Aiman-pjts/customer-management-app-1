import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import type { Customer, CustomerFormData } from "../types/customer";

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: CustomerFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
}

const initialFormData: CustomerFormData = {
  name: "",
  phone: "",
  email: "",
  city: "",
};

export default function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CustomerFormProps) {
  const [formData, setFormData] =
    useState<CustomerFormData>(initialFormData);

  const [errors, setErrors] = useState<FormErrors>({});

  // Populate form when editing a customer
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
      });
    } else {
      setFormData({ ...initialFormData });
    }

    setErrors({});
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [customer]);

  // Handle input changes
  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((previous) => ({
        ...previous,
        [name]: undefined,
      }));
    }
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required.";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (
      !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]+$/.test(
        formData.phone.trim()
      )
    ) {
      newErrors.phone = "Please enter a valid phone number.";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting || !validate()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      city: formData.city.trim(),
    });

    // Reset only when adding a new customer
    if (!customer) {
      setFormData({ ...initialFormData });
      setErrors({});
    }
  };

  // Input styling
  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition
    ${
      errors[field]
        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
        : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    }`;

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          {customer ? "Edit Customer" : "Add New Customer"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {customer
            ? "Update the customer's information below."
            : "Enter the customer's information below to add them to your customer list."}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Customer Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Customer Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter customer name"
              className={inputClass("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={
                errors.name ? "name-error" : undefined
              }
            />

            {errors.name && (
              <p
                id="name-error"
                className="mt-1.5 text-sm text-red-600"
              >
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Phone
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              className={inputClass("phone")}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? "phone-error" : undefined
              }
            />

            {errors.phone && (
              <p
                id="phone-error"
                className="mt-1.5 text-sm text-red-600"
              >
                {errors.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className={inputClass("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "email-error" : undefined
              }
            />

            {errors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-sm text-red-600"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* City */}
          <div>
            <label
              htmlFor="city"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              City
            </label>

            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city"
              className={inputClass("city")}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={
                errors.city ? "city-error" : undefined
              }
            />

            {errors.city && (
              <p
                id="city-error"
                className="mt-1.5 text-sm text-red-600"
              >
                {errors.city}
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isSubmitting ? "cursor-not-allowed opacity-75" : ""
            }`}
          >
            {customer ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}

            {isSubmitting
              ? customer
                ? "Updating..."
                : "Adding..."
              : customer
              ? "Update Customer"
              : "Add Customer"}
          </button>

          {/* Cancel button only appears while editing */}
          {customer && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}