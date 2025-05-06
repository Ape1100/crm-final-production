import { useState, useEffect } from 'react';
import { Users, FileText, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { BusinessHeader } from '../components/BusinessHeader';
import { supabase } from '../lib/supabase';

// Currency formatter
const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

type DashboardInvoice = { amount: number; created_at: string; status: string };

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalInvoices: 0,
    revenue: 0,
    growth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);

      // Fetch total customers
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (customerError) throw customerError;

      // Fetch total invoices and revenue
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('amount, created_at, status');

      if (invoicesError) throw invoicesError;

      // Use null coalescing to handle undefined/null values
      const safeInvoices: DashboardInvoice[] = invoices ?? [];
      const safeTotalCustomers = customerCount ?? 0;

      // Calculate total invoices and revenue
      const totalInvoices = safeInvoices.length;
      const totalRevenue = safeInvoices
        .filter((inv: DashboardInvoice) => inv.status === 'paid')
        .reduce((sum: number, inv: DashboardInvoice) => sum + (Number(inv.amount) || 0), 0);

      // Calculate growth (comparing this month to last month)
      const now = new Date();
      const thisMonth = safeInvoices
        .filter((inv: DashboardInvoice) => {
          const date = new Date(inv.created_at);
          return date.getMonth() === now.getMonth() && 
                 date.getFullYear() === now.getFullYear() &&
                 inv.status === 'paid';
        })
        .reduce((sum: number, inv: DashboardInvoice) => sum + (Number(inv.amount) || 0), 0);

      const lastMonth = safeInvoices
        .filter((inv: DashboardInvoice) => {
          const date = new Date(inv.created_at);
          const lastMonthDate = new Date();
          lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
          return date.getMonth() === lastMonthDate.getMonth() && 
                 date.getFullYear() === lastMonthDate.getFullYear() &&
                 inv.status === 'paid';
        })
        .reduce((sum: number, inv: DashboardInvoice) => sum + (Number(inv.amount) || 0), 0);

      const growth = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

      setStats({
        totalCustomers: safeTotalCustomers,
        totalInvoices,
        revenue: totalRevenue,
        growth
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  const dashboardStats = [
    { label: 'Total Customers', value: stats.totalCustomers.toString(), icon: Users },
    { label: 'Total Invoices', value: stats.totalInvoices.toString(), icon: FileText },
    { label: 'Revenue', value: currencyFormatter.format(stats.revenue), icon: DollarSign },
    { label: 'Growth', value: `${stats.growth.toFixed(1)}%`, icon: TrendingUp },
  ];

  if (error) {
    return (
      <div>
        <BusinessHeader className="mb-8" />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BusinessHeader className="mb-8" />
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  {loading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  )}
                </div>
                <Icon className="text-blue-500" size={24} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}