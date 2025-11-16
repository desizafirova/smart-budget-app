import { useState } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';

export default function Transactions() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleTransactionSuccess = () => {
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Transactions</h1>
      <p className="text-lg text-gray-600 mb-8">
        Track your income and expenses
      </p>

      {/* Add Transaction Button */}
      <button
        onClick={() => setShowTransactionForm(true)}
        className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        + New Transaction
      </button>

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
