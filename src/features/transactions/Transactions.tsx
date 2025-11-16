import { useState, useEffect } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { DeleteConfirmationModal } from '@/components/transactions/DeleteConfirmationModal';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAuthStore } from '@/stores/authStore';
import type { Transaction } from '@/types/transaction';

export default function Transactions() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Transaction added');

  // Get current user and transaction store
  const user = useAuthStore((state) => state.user);
  const {
    transactions,
    isLoading,
    isSaving,
    error,
    editingTransaction,
    setEditingTransaction,
    deleteTransaction,
    subscribeToTransactions,
    unsubscribeFromTransactions,
  } = useTransactionStore();

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
    // Show success toast for add/edit
    setToastMessage('Transaction saved');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Edit handler: Set transaction for editing and open modal
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  // Delete handler: Set transaction for deletion and open confirmation modal
  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setShowDeleteModal(true);
  };

  // Confirm delete: Call deleteTransaction action and close modal on success
  const confirmDelete = async () => {
    if (!deletingTransaction || !user?.uid) return;

    try {
      await deleteTransaction(user.uid, deletingTransaction.id);
      // Success: close modal and clear state
      setShowDeleteModal(false);
      setDeletingTransaction(null);
      // Show success toast
      setToastMessage('Transaction deleted');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      // Error is handled by store and displayed in modal
      // Modal stays open for retry
      console.error('Delete transaction failed:', error);
    }
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
        onClose={() => {
          setShowTransactionForm(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleTransactionSuccess}
        mode={editingTransaction ? 'edit' : 'create'}
        initialTransaction={editingTransaction || undefined}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingTransaction(null);
        }}
        onConfirm={confirmDelete}
        transaction={deletingTransaction}
        isDeleting={isSaving}
        error={error}
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
            <p className="text-sm font-medium text-green-800">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
