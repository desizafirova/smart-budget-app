import { Outlet, Link, useLocation } from 'react-router';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <nav
          role="navigation"
          className="container mx-auto px-4 py-4 flex items-center justify-between"
        >
          <h1 className="text-xl font-bold text-gray-900">SmartBudget</h1>
          <div className="flex gap-4 md:gap-6">
            <Link
              to="/"
              className={`hover:text-blue-600 ${
                location.pathname === '/'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/transactions"
              className={`hover:text-blue-600 ${
                location.pathname === '/transactions'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700'
              }`}
            >
              Transactions
            </Link>
            <Link
              to="/categories"
              className={`hover:text-blue-600 ${
                location.pathname === '/categories'
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-700'
              }`}
            >
              Categories
            </Link>
          </div>
        </nav>
      </header>

      <main role="main" className="flex-1 container mx-auto p-4 max-w-7xl">
        <Outlet />
      </main>

      <footer
        role="contentinfo"
        className="border-t p-4 text-center text-sm text-gray-600"
      >
        <p>&copy; 2025 SmartBudget. Built with React + Firebase.</p>
        {/* Test comment: Deployment pipeline validation */}
      </footer>
    </div>
  );
}
