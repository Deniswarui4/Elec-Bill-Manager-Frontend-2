import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../components/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { metersAPI, billsAPI, authAPI, readingsAPI, settingsAPI } from '../services/api';
import { BillingSummary } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalMeters: 0,
    totalUsers: 0,
    totalReadings: 0,
    billingSummary: null as BillingSummary | null,
  });
  const [kwhRate, setKwhRate] = useState<string>('');
  const [kwhSaving, setKwhSaving] = useState<boolean>(false);
  const [kwhError, setKwhError] = useState<string>('');
  const [kwhSuccess, setKwhSuccess] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  useEffect(() => {
    loadDashboardData();
    if (user?.role === 'ADMIN') {
      loadKwhRate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const loadKwhRate = async () => {
    try {
      const res = await settingsAPI.getKwhRate();
      setKwhRate(res.value);
    } catch (e: any) {
      setKwhRate('25.0');
    }
  };

  const saveKwhRate = async () => {
    try {
      setKwhError('');
      setKwhSuccess('');
      setKwhSaving(true);
      const valueNum = parseFloat(kwhRate);
      if (Number.isNaN(valueNum) || valueNum < 0) {
        setKwhError('Enter a valid positive number');
        setKwhSaving(false);
        return;
      }
      if (!confirmPassword) {
        setKwhError('Password required');
        setKwhSaving(false);
        return;
      }
      const res = await settingsAPI.updateKwhRate(valueNum, confirmPassword);
      setKwhRate(res.value);
      setKwhSuccess('Updated');
      setConfirmPassword('');
    } catch (e: any) {
      setKwhError(e?.response?.data?.error || e?.response?.data?.errors?.[0]?.msg || 'Failed to update rate');
    } finally {
      setKwhSaving(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const promises = [] as any[];
      
      // Load different data based on user role
      if (user?.role === 'ADMIN') {
        promises.push(
          metersAPI.getAll(),
          authAPI.getAllUsers(),
          billsAPI.getSummary(),
          readingsAPI.getAll()
        );
      } else if (user?.role === 'LANDLORD') {
        promises.push(
          metersAPI.getAll(),
          billsAPI.getSummary()
        );
      } else if (user?.role === 'TECHNICIAN') {
        promises.push(
          readingsAPI.getAll(),
          metersAPI.getAll()
        );
      }

      const results = await Promise.allSettled(promises);
      
      const newData: any = {
        totalMeters: 0,
        totalUsers: 0,
        totalReadings: 0,
        billingSummary: null,
      };

      if (user?.role === 'ADMIN') {
        if (results[0].status === 'fulfilled') {
          newData.totalMeters = (results[0] as any).value.meters?.length || 0;
        }
        if (results[1].status === 'fulfilled') {
          newData.totalUsers = (results[1] as any).value.users?.length || 0;
        }
        if (results[2].status === 'fulfilled') {
          newData.billingSummary = (results[2] as any).value.summary;
        }
        if (results[3].status === 'fulfilled') {
          newData.totalReadings = (results[3] as any).value.data?.length || 0;
        }
      } else if (user?.role === 'LANDLORD') {
        if (results[0].status === 'fulfilled') {
          newData.totalMeters = (results[0] as any).value.meters?.length || 0;
        }
        if (results[1].status === 'fulfilled') {
          newData.billingSummary = (results[1] as any).value.summary;
        }
      } else if (user?.role === 'TECHNICIAN') {
        if (results[0].status === 'fulfilled') {
          newData.totalReadings = (results[0] as any).value.data?.length || 0;
        }
        if (results[1].status === 'fulfilled') {
          newData.totalMeters = (results[1] as any).value.meters?.length || 0;
        }
      }

      setDashboardData(newData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.name || user?.phoneNumber}! 
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {user?.role}
            </span>
          </p>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user?.role === 'ADMIN' && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{dashboardData.totalUsers}</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        👥
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Meters</p>
                        <p className="text-2xl font-bold text-blue-600">{dashboardData.totalMeters}</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        ⚡
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Readings</p>
                        <p className="text-2xl font-bold text-purple-600">{dashboardData.totalReadings}</p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        📊
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Bills</p>
                        <p className="text-2xl font-bold text-green-600">{dashboardData.billingSummary?.totalBills || 0}</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        💰
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {user?.role === 'LANDLORD' && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">My Meters</p>
                        <p className="text-2xl font-bold text-blue-600">{dashboardData.totalMeters}</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        ⚡
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Paid Bills</p>
                        <p className="text-2xl font-bold text-green-600">{dashboardData.billingSummary?.paidBills || 0}</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        ✅
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pending Bills</p>
                        <p className="text-2xl font-bold text-yellow-600">{dashboardData.billingSummary?.pendingBills || 0}</p>
                      </div>
                      <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        ⏳
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Amount</p>
                        <p className="text-2xl font-bold text-gray-900">{formatKES(dashboardData.billingSummary?.totalAmount || 0)}</p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        💰
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            
            {user?.role === 'TECHNICIAN' && (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Available Meters</p>
                        <p className="text-2xl font-bold text-blue-600">{dashboardData.totalMeters}</p>
                      </div>
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        ⚡
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">My Readings</p>
                        <p className="text-2xl font-bold text-purple-600">{dashboardData.totalReadings}</p>
                      </div>
                      <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                        📊
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Today's Readings</p>
                        <p className="text-2xl font-bold text-green-600">0</p>
                      </div>
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        📅
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {user?.role === 'ADMIN' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Default KWh Rate (KES)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={kwhRate}
                      onChange={(e) => setKwhRate(e.target.value)}
                      className="input mt-1"
                      autoComplete="off"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input mt-1"
                      placeholder="Enter your admin password"
                      name="admin-confirm-password"
                      autoComplete="new-password"
                      autoCapitalize="off"
                      spellCheck={false}
                    />
                  </div>
                  <div className="md:col-span-1">
                    <Button onClick={saveKwhRate} disabled={kwhSaving}>
                      {kwhSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  {kwhError && <p className="text-sm text-red-600 md:col-span-3">{kwhError}</p>}
                  {kwhSuccess && <p className="text-sm text-green-600 md:col-span-3">{kwhSuccess}</p>}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <p><strong>Default KWh Rate:</strong> KES {kwhRate || '25.00'}</p>
                  <p><strong>Your Role:</strong> {user?.role}</p>
                  <p><strong>Account:</strong> {user?.phoneNumber}</p>
                  {user?.name && <p><strong>Name:</strong> {user.name}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
};

export default Dashboard;