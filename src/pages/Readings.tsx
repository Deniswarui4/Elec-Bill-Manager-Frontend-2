import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { readingsAPI, metersAPI } from '../services/api';
import { MeterReading, Meter } from '../types';
import { useAuth } from '../context/AuthContext';

const Readings: React.FC = () => {
  const { user } = useAuth();
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    meterId: '',
    reading: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [readingsResponse, metersResponse] = await Promise.all([
        readingsAPI.getAll(),
        metersAPI.getAll()
      ]);
      
      setReadings(readingsResponse.data);
      setMeters(metersResponse.meters);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    setSuccessMessage(null);

    try {
      const response = await readingsAPI.create({
        meterId: formData.meterId,
        reading: parseFloat(formData.reading),
      });

      setFormData({ meterId: '', reading: '' });
      
      if (response.bill) {
        setSuccessMessage(
          `Reading recorded successfully! A bill of KES ${response.bill.totalAmount.toFixed(2)} has been generated for ${response.bill.unitsConsumed} units consumed.`
        );
      } else {
        setSuccessMessage('Reading recorded successfully!');
      }
      
      await loadData();
    } catch (error: any) {
      setFormError(error.response?.data?.error || 'Error recording reading');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setSuccessMessage(null);
    setFormData({ meterId: '', reading: '' });
  };

  const meterOptions = meters.map(meter => ({
    value: meter.id,
    label: `${meter.meterNumber} - ${meter.plotNumber} (${meter.landlord.name || meter.landlord.phoneNumber})`
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meter Readings</h1>
            <p className="text-gray-600">
              {user?.role === 'TECHNICIAN' 
                ? 'Record new meter readings and view your reading history'
                : 'View all meter readings in the system'
              }
            </p>
          </div>
          {(user?.role === 'TECHNICIAN' || user?.role === 'ADMIN') && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Record New Reading
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Readings</p>
                  <p className="text-2xl font-bold text-gray-900">{readings.length}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  📊
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Meters</p>
                  <p className="text-2xl font-bold text-gray-900">{meters.filter(m => m.isActive).length}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  ⚡
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Today's Readings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {readings.filter(r => 
                      new Date(r.readingDate).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  📅
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Readings</CardTitle>
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
                    <TableHead>Meter</TableHead>
                    <TableHead>Plot</TableHead>
                    <TableHead>Current Reading</TableHead>
                    <TableHead>Previous Reading</TableHead>
                    <TableHead>Units Consumed</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell className="font-medium">{reading.meter.meterNumber}</TableCell>
                      <TableCell>{reading.meter.plotNumber}</TableCell>
                      <TableCell>{reading.reading.toLocaleString()}</TableCell>
                      <TableCell>{reading.previousReading?.toLocaleString() || '-'}</TableCell>
                      <TableCell>
                        <span className="font-medium text-blue-600">
                          {reading.unitsConsumed?.toLocaleString() || '0'} kWh
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{reading.technician.name || 'Technician'}</div>
                          <div className="text-sm text-gray-500">{reading.technician.phoneNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(reading.readingDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title="Record New Reading"
          size="md"
        >
          {successMessage ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">Reading Recorded!</h3>
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={closeModal}>Close</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Select Meter"
                value={formData.meterId}
                onChange={(e) => setFormData({ ...formData, meterId: e.target.value })}
                options={meterOptions}
                required
              />

              <Input
                label="Meter Reading"
                type="number"
                step="0.01"
                value={formData.reading}
                onChange={(e) => setFormData({ ...formData, reading: e.target.value })}
                placeholder="Enter current meter reading"
                required
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-600">
                  <strong>Note:</strong> The system will automatically calculate units consumed and generate a bill if there's consumption. 
                  Make sure the reading is accurate and not less than the previous reading.
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={formLoading}>
                  {formLoading ? 'Recording...' : 'Record Reading'}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </SidebarLayout>
  );
};

export default Readings;