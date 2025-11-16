/**
 * Transaction Form Modal Component
 *
 * Modal form for adding new transactions (income/expense).
 * Features:
 * - Client-side validation with react-hook-form
 * - Auto-detection of transaction type from amount sign
 * - Optimistic updates for instant UI feedback
 * - Mobile-friendly inputs (numeric keyboard, date picker)
 * - Real-time validation with error display
 * - Accessibility features (ARIA labels, keyboard navigation)
 */

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';
import type { CreateTransactionInput, Transaction } from '@/types/transaction';

interface TransactionFormProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when transaction is successfully added */
  onSuccess?: () => void;
  /** Form mode: create or edit */
  mode?: 'create' | 'edit';
  /** Transaction to edit (required when mode is 'edit') */
  initialTransaction?: Transaction;
}

interface TransactionFormData {
  amount: string; // String for input, converted to number
  description: string;
  category: string;
  date: string; // ISO date string from input
}

/**
 * Modal component for adding transactions
 */
export function TransactionForm({
  isOpen,
  onClose,
  onSuccess,
  mode = 'create',
  initialTransaction,
}: TransactionFormProps) {
  const { addTransaction, updateTransaction, isSaving } = useTransactionStore();
  const { user } = useAuthStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    control,
  } = useForm<TransactionFormData>({
    mode: 'onChange', // Real-time validation
    defaultValues:
      mode === 'edit' && initialTransaction
        ? {
            amount: String(initialTransaction.amount),
            description: initialTransaction.description,
            category: initialTransaction.category,
            date: initialTransaction.date instanceof Date
              ? initialTransaction.date.toISOString().split('T')[0]
              : new Date(initialTransaction.date).toISOString().split('T')[0],
          }
        : {
            amount: '',
            description: '',
            category: 'Uncategorized',
            date: new Date().toISOString().split('T')[0], // Today's date
          },
  });

  // Watch description to show character count (using useWatch for React Compiler compatibility)
  const description = useWatch({ control, name: 'description' });
  const characterCount = description?.length || 0;

  const handleClose = () => {
    reset({
      amount: '',
      description: '',
      category: 'Uncategorized',
      date: new Date().toISOString().split('T')[0],
    });
    setSubmitError(null);
    setSubmitSuccess(false);
    onClose();
  };

  const onSubmit = async (data: TransactionFormData) => {
    if (!user?.uid) {
      setSubmitError('You must be signed in to manage transactions');
      return;
    }

    try {
      setSubmitError(null);

      // Convert form data
      const amount = parseFloat(data.amount);
      const transactionData = {
        amount,
        description: data.description.trim(),
        category: data.category,
        date: new Date(data.date),
      };

      if (mode === 'edit' && initialTransaction) {
        // Update existing transaction
        await updateTransaction(user.uid, initialTransaction.id, transactionData);
      } else {
        // Create new transaction
        const input: CreateTransactionInput = transactionData;
        await addTransaction(user.uid, input);
      }

      // Success!
      setSubmitSuccess(true);

      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }

      // Close modal and reset form after brief delay
      setTimeout(() => {
        handleClose();
      }, 800);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${mode === 'edit' ? 'update' : 'add'} transaction. Please try again.`;
      setSubmitError(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transaction-form-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Modal content */}
          <div className="p-6">
            <h2
              id="transaction-form-title"
              className="mb-2 text-2xl font-bold text-gray-900"
            >
              {mode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              {mode === 'edit'
                ? 'Update transaction details below.'
                : 'Enter transaction details. Use positive numbers for income, negative for expenses.'}
            </p>

            {/* Success message */}
            {submitSuccess && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-800">
                    {mode === 'edit' ? 'Transaction updated successfully!' : 'Transaction added successfully!'}
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {submitError && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{submitError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Amount field */}
              <div className="mb-4">
                <label
                  htmlFor="amount"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Amount *
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  inputMode="decimal" // Mobile numeric keyboard
                  disabled={isSaving || submitSuccess}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                  placeholder="0.00 (positive for income, negative for expense)"
                  {...register('amount', {
                    required: 'Amount is required',
                    validate: {
                      notZero: (value) => {
                        const num = parseFloat(value);
                        return num !== 0 || 'Amount cannot be zero';
                      },
                      validNumber: (value) => {
                        const num = parseFloat(value);
                        return !isNaN(num) || 'Amount must be a valid number';
                      },
                    },
                  })}
                  aria-invalid={errors.amount ? 'true' : 'false'}
                  aria-describedby={errors.amount ? 'amount-error' : undefined}
                />
                {errors.amount && (
                  <p
                    id="amount-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Description field */}
              <div className="mb-4">
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <span
                    className={`text-xs ${characterCount > 100 ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    {characterCount}/100
                  </span>
                </div>
                <input
                  id="description"
                  type="text"
                  maxLength={100}
                  disabled={isSaving || submitSuccess}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                  placeholder="What was this for?"
                  {...register('description', {
                    required: 'Description is required',
                    maxLength: {
                      value: 100,
                      message: 'Description cannot exceed 100 characters',
                    },
                  })}
                  aria-invalid={errors.description ? 'true' : 'false'}
                  aria-describedby={
                    errors.description ? 'description-error' : undefined
                  }
                />
                {errors.description && (
                  <p
                    id="description-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Category field */}
              <div className="mb-4">
                <label
                  htmlFor="category"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Category *
                </label>
                <select
                  id="category"
                  disabled={isSaving || submitSuccess}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                  {...register('category', {
                    required: 'Category is required',
                  })}
                  aria-invalid={errors.category ? 'true' : 'false'}
                  aria-describedby={
                    errors.category ? 'category-error' : undefined
                  }
                >
                  <option value="Uncategorized">Uncategorized</option>
                </select>
                {errors.category && (
                  <p
                    id="category-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.category.message}
                  </p>
                )}
              </div>

              {/* Date field */}
              <div className="mb-6">
                <label
                  htmlFor="date"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  disabled={isSaving || submitSuccess}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
                  {...register('date', {
                    required: 'Date is required',
                  })}
                  aria-invalid={errors.date ? 'true' : 'false'}
                  aria-describedby={errors.date ? 'date-error' : undefined}
                />
                {errors.date && (
                  <p
                    id="date-error"
                    className="mt-1 text-sm text-red-600"
                    role="alert"
                  >
                    {errors.date.message}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving || submitSuccess}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || isSaving || submitSuccess}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-400"
                >
                  {isSaving
                    ? mode === 'edit'
                      ? 'Updating...'
                      : 'Adding...'
                    : submitSuccess
                      ? mode === 'edit'
                        ? 'Updated!'
                        : 'Added!'
                      : mode === 'edit'
                        ? 'Update Transaction'
                        : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
