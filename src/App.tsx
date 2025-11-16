import { createBrowserRouter, RouterProvider } from 'react-router';
import { lazy, Suspense } from 'react';
import type {} from 'react';
import Layout from '@/components/layout/Layout';
import { AuthProvider } from '@/providers/AuthProvider';

const Dashboard = lazy(() => import('@/features/dashboard/Dashboard'));
const Transactions = lazy(
  () => import('@/features/transactions/Transactions')
);
const Categories = lazy(() => import('@/features/categories/Categories'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'transactions', element: <Transactions /> },
      { path: 'categories', element: <Categories /> },
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  );
}

export default App;
