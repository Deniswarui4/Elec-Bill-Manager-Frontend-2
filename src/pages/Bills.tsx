import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { billsAPI } from '../services/api';
import { Bill, BillingSummary } from '../types';
import { useAuth } from '../context/AuthContext';

const Bills: React.FC = () => {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState(false);
  const [viewBillData, setViewBillData] = useState<Bill | null>(null);
  const [updateOverdueLoading, setUpdateOverdueLoading] = useState(false);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billsResponse, summaryResponse] = await Promise.all([
        billsAPI.getAll(statusFilter || undefined),
        billsAPI.getSummary()
      ]);
      
      setBills(billsResponse.data);
      setSummary(summaryResponse.summary);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      setPaymentLoading(billId);
      await billsAPI.markAsPaid(billId);
      await loadData(); // Reload data to refresh the table and summary
    } catch (error: any) {
      console.error('Error marking bill as paid:', error);
      alert(error.response?.data?.error || 'Error marking bill as paid');
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleViewBill = (bill: Bill) => {
    setViewBillData(bill);
    setViewModal(true);
  };

  const closeViewModal = () => {
    setViewModal(false);
    setViewBillData(null);
  };

  const handleUpdateOverdue = async () => {
    try {
      setUpdateOverdueLoading(true);
      const response = await billsAPI.updateOverdue();
      alert(`Updated ${response.updatedCount} overdue bills successfully!`);
      await loadData(); // Reload data to see changes
    } catch (error: any) {
      console.error('Error updating overdue bills:', error);
      alert(error.response?.data?.error || 'Error updating overdue bills');
    } finally {
      setUpdateOverdueLoading(false);
    }
  };

  const handleExportBills = () => {
    // Generate CSV data
    const csvData = bills.map(bill => ({
      'Bill Number': bill.billNumber,
      'Meter Number': bill.meter.meterNumber,
      'Plot Number': bill.meter.plotNumber,
      'Landlord Name': bill.landlord.name || 'N/A',
      'Landlord Phone': bill.landlord.phoneNumber,
      'Units Consumed': bill.unitsConsumed,
      'Rate per Unit': bill.ratePerUnit,
      'Total Amount': bill.totalAmount,
      'Bill Date': new Date(bill.billDate || bill.createdAt).toLocaleDateString(),
      'Due Date': new Date(bill.dueDate).toLocaleDateString(),
      'Status': bill.status,
      'Paid Date': bill.paidDate ? new Date(bill.paidDate).toLocaleDateString() : 'N/A'
    }));
    
    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {});
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n');
    
    // Download CSV file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bills-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadBillPDF = (bill: Bill) => {
    // Generate a simple HTML content for the bill
    const billHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .bill-info { margin: 20px 0; }
          .bill-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .bill-details th, .bill-details td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .bill-details th { background-color: #f2f2f2; }
          .total { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Electricity Bill</h1>
          <h2>EBS - Electricity Billing System</h2>
        </div>
        
        <div class="bill-info">
          <p><strong>Bill Number:</strong> ${bill.billNumber}</p>
                  <p><strong>Bill Date:</strong> ${formatDate(bill.billDate || bill.createdAt)}</p>
          <p><strong>Due Date:</strong> ${formatDate(bill.dueDate)}</p>
          <p><strong>Status:</strong> ${bill.status}</p>
        </div>
        
        <div class="bill-info">
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${bill.landlord.name || 'N/A'}</p>
          <p><strong>Phone:</strong> ${bill.landlord.phoneNumber}</p>
        </div>
        
        <div class="bill-info">
          <h3>Meter Information</h3>
          <p><strong>Meter Number:</strong> ${bill.meter.meterNumber}</p>
          <p><strong>Plot Number:</strong> ${bill.meter.plotNumber}</p>
          ${bill.meter.location ? `<p><strong>Location:</strong> ${bill.meter.location}</p>` : ''}
        </div>
        
        <table class="bill-details">
          <tr>
            <th>Description</th>
            <th>Units (kWh)</th>
            <th>Rate per Unit</th>
            <th>Amount</th>
          </tr>
          <tr>
            <td>Electricity Consumption</td>
            <td>${bill.unitsConsumed.toLocaleString()}</td>
            <td>${formatKES(bill.ratePerUnit)}</td>
            <td>${formatKES(bill.totalAmount)}</td>
          </tr>
          <tr class="total">
            <td colspan="3">Total Amount Due</td>
            <td>${formatKES(bill.totalAmount)}</td>
          </tr>
        </table>
        
        ${bill.status === 'PAID' && bill.paidDate ? `<p><strong>Paid on:</strong> ${formatDate(bill.paidDate)}</p>` : ''}
        
        <p style="margin-top: 40px; font-size: 12px; color: #666;">
          Generated on ${new Date().toLocaleDateString()} by EBS System
        </p>
      </body>
      </html>
    `;
    
    // Create a blob and download
    const blob = new Blob([billHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bill-${bill.billNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'PENDING' && new Date(dueDate) < new Date();
  };

  const statusOptions = [
    { value: '', label: 'All Bills' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bills Management</h1>
            <p className="text-gray-600">
              {user?.role === 'LANDLORD' 
                ? 'View your electricity bills and payment status'
                : 'Manage electricity bills and payments'
              }
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Bills</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalBills}</p>
                  </div>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    📄
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Paid Bills</p>
                    <p className="text-2xl font-bold text-green-600">{summary.paidBills}</p>
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
                    <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatKES(summary.pendingAmount)}</p>
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
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-purple-600">{formatKES(summary.totalAmount)}</p>
                  </div>
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    💰
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Bills ({bills.length})</CardTitle>
              <div className="w-48">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={statusOptions}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Meter</TableHead>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Units (kWh)</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((bill) => (
                    <TableRow 
                      key={bill.id} 
                      className={isOverdue(bill.dueDate, bill.status) ? 'bg-red-50' : ''}
                    >
                      <TableCell className="font-medium">{bill.billNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bill.meter.meterNumber}</div>
                          <div className="text-sm text-gray-500">{bill.meter.plotNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{bill.landlord.name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{bill.landlord.phoneNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{bill.unitsConsumed.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{formatKES(bill.totalAmount)}</div>
                          <div className="text-sm text-gray-500">@{formatKES(bill.ratePerUnit)}/kWh</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={isOverdue(bill.dueDate, bill.status) ? 'text-red-600 font-medium' : ''}>
                          {formatDate(bill.dueDate)}
                          {isOverdue(bill.dueDate, bill.status) && (
                            <div className="text-xs text-red-500">OVERDUE</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                        {bill.status === 'PAID' && bill.paidDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Paid: {formatDate(bill.paidDate)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {user?.role === 'ADMIN' && bill.status !== 'PAID' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleMarkAsPaid(bill.id)}
                              disabled={paymentLoading === bill.id}
                            >
                              {paymentLoading === bill.id ? 'Marking...' : 'Mark Paid'}
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewBill(bill)}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {user?.role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button 
                  variant="secondary"
                  onClick={handleUpdateOverdue}
                  disabled={updateOverdueLoading}
                >
                  {updateOverdueLoading ? 'Updating...' : 'Update Overdue Bills'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportBills}
                  disabled={bills.length === 0}
                >
                  Export Bills Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Bill Details Modal */}
        <Modal
          isOpen={viewModal}
          onClose={closeViewModal}
          title="Bill Details"
          size="lg"
        >
          {viewBillData && (
            <div className="space-y-6">
              {/* Header Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bill Number</label>
                    <p className="text-lg font-semibold">{viewBillData.billNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewBillData.status)}`}>
                      {viewBillData.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meter and Landlord Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Meter Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Meter Number</label>
                      <p className="font-medium">{viewBillData.meter.meterNumber}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Plot Number</label>
                      <p>{viewBillData.meter.plotNumber}</p>
                    </div>
                    {viewBillData.meter.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p>{viewBillData.meter.location}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Landlord Information</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="font-medium">{viewBillData.landlord.name || 'No Name'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                      <p>{viewBillData.landlord.phoneNumber}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Units Consumed</label>
                    <p className="text-xl font-semibold text-blue-600">{viewBillData.unitsConsumed.toLocaleString()} kWh</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rate per Unit</label>
                    <p className="text-lg font-medium">{formatKES(viewBillData.ratePerUnit)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="text-2xl font-bold text-green-600">{formatKES(viewBillData.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bill Date</label>
                  <p>{formatDate(viewBillData.billDate || viewBillData.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <p className={isOverdue(viewBillData.dueDate, viewBillData.status) ? 'text-red-600 font-semibold' : ''}>
                    {formatDate(viewBillData.dueDate)}
                    {isOverdue(viewBillData.dueDate, viewBillData.status) && (
                      <span className="block text-xs text-red-500">OVERDUE</span>
                    )}
                  </p>
                </div>
                {viewBillData.status === 'PAID' && viewBillData.paidDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Paid Date</label>
                    <p className="text-green-600 font-semibold">{formatDate(viewBillData.paidDate)}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex space-x-3">
                  {user?.role === 'ADMIN' && viewBillData.status !== 'PAID' && (
                    <Button
                      variant="primary"
                      onClick={() => {
                        handleMarkAsPaid(viewBillData.id);
                        closeViewModal();
                      }}
                      disabled={paymentLoading === viewBillData.id}
                    >
                      {paymentLoading === viewBillData.id ? 'Marking...' : 'Mark as Paid'}
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => handleDownloadBillPDF(viewBillData)}
                  >
                    Download Bill
                  </Button>
                </div>
                <Button variant="outline" onClick={closeViewModal}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </SidebarLayout>
  );
};

export default Bills;