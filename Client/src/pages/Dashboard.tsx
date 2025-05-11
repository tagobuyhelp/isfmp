import React, { useState, useEffect } from 'react';
import { Users, DollarSign, ShoppingCart, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Statistics {
  totalMembers: number;
  activeMembers: number;
  generalMembers: number;
  stateDistribution: Array<{ _id: string; count: number }>;
  membershipOverview: {
    active: number;
    general: number;
    total: number;
    activeRate: string;
  };
  totalRevenue: number;
  totalTransactions: number;
  totalDonations: number;
  dailyNewMembers: Array<{ _id: string; newMembers: number }>;
  dailyRevenue: Array<{ _id: string; revenue: number; transactions: number }>;
}

interface DashboardResponse {
  statusCode: number;
  data: string;
  message: Statistics;
  success: boolean;
}

const Dashboard = () => {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/statistics/dashboard`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data: DashboardResponse = await response.json();
      setStatistics(data.message);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        {error}
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const stats = [
    { 
      icon: Users, 
      title: 'Total Members', 
      value: statistics.totalMembers.toLocaleString(),
      change: '+12.5%',
      trend: 'up'
    },
    { 
      icon: DollarSign, 
      title: 'Total Revenue', 
      value: `₹${statistics.totalRevenue.toLocaleString()}`,
      change: '+8.2%',
      trend: 'up'
    },
    { 
      icon: ShoppingCart, 
      title: 'Total Transactions', 
      value: statistics.totalTransactions.toLocaleString(),
      change: '+5.4%',
      trend: 'up'
    },
    { 
      icon: TrendingUp, 
      title: 'Total Donations', 
      value: statistics.totalDonations.toLocaleString(),
      change: '-3.1%',
      trend: 'down'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className={`text-sm flex items-center ${
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.trend === 'up' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                  {stat.change}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <stat.icon className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-6">State-wise Distribution</h2>
          <div className="space-y-4">
            {statistics.stateDistribution.map((state) => (
              <div key={state._id}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">{state._id}</span>
                  <span className="text-sm font-medium text-gray-900">{state.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(state.count / statistics.totalMembers) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Membership Overview</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Active Members</span>
                <span className="text-sm font-medium text-gray-900">
                  {statistics.membershipOverview.active}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${statistics.membershipOverview.activeRate}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {statistics.membershipOverview.activeRate}% of total members
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">General Members</span>
                <span className="text-sm font-medium text-gray-900">
                  {statistics.membershipOverview.general}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${(statistics.membershipOverview.general / statistics.membershipOverview.total * 100).toFixed(1)}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(statistics.membershipOverview.general / statistics.membershipOverview.total * 100).toFixed(1)}% of total members
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {statistics.membershipOverview.total}
                  </div>
                  <div className="text-sm text-gray-500">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {statistics.membershipOverview.activeRate}%
                  </div>
                  <div className="text-sm text-gray-500">Active Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Daily New Members</h2>
          <div className="space-y-4">
            {statistics.dailyNewMembers.slice(-7).map((day) => {
              const maxMembers = Math.max(...statistics.dailyNewMembers.map(d => d.newMembers));
              const percentage = (day.newMembers / maxMembers) * 100;
              
              return (
                <div key={day._id}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {new Date(day._id).toLocaleDateString()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {day.newMembers}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-6">Daily Revenue</h2>
          <div className="space-y-4">
            {statistics.dailyRevenue.slice(-7).map((day) => {
              const maxRevenue = Math.max(...statistics.dailyRevenue.map(d => d.revenue));
              const percentage = (day.revenue / maxRevenue) * 100;

              return (
                <div key={day._id}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {new Date(day._id).toLocaleDateString()}
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        ₹{day.revenue.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({day.transactions} transactions)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;