import { useState, useEffect } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';
import type { Transaction } from '@/types/transaction';

export default function Transactions() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Get current user and transaction store
  const user = useAuthStore((state) => state.user);
  const { transactions, isLoading, subscribeToTransactions, unsubscribeFromTransactions } =
    useTransactionStore();

  // Subscribe to real-time transaction updates on mount
  useEffect(() => {
    if (user?.uid) {
      subscribeToTransactions(user.uid);
    }

    // Cleanup: unsubscribe on unmount or user sign out
    return () => {
      unsubscribeFromTransactions();
    };
  }, [user?.uid, subscribeToTransactions, unsubscribeFromTransactions]);

  const handleTransactionSuccess = () => {
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Stub handlers for Edit and Delete (will be implemented in Stories 3.3 and 3.4)
  const handleEdit = (transaction: Transaction) => {
    console.log('Edit transaction:', transaction);
    // TODO Story 3.3: Open TransactionForm in edit mode with initial values
  };

  const handleDelete = (transactionId: string) => {
    console.log('Delete transaction:', transactionId);
    // TODO Story 3.4: Show DeleteConfirmationModal
  };

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Transactions</h1>
        <p className="text-lg text-gray-600 mb-6">
          Track your income and expenses
        </p>

        {/* Add Transaction Button */}
        <button
          onClick={() => setShowTransactionForm(true)}
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + New Transaction
        </button>
      </div>

      {/* Transaction List */}
      <div className="mt-8">
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSuccess={handleTransactionSuccess}
      />

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-green-50 p-4 shadow-lg">
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
              Transaction added
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
