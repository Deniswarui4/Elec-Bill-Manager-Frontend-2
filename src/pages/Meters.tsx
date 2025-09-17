import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { metersAPI, authAPI } from '../services/api';
import { Meter, User } from '../types';

const Meters: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [landlords, setLandlords] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    meterNumber: '',
    plotNumber: '',
    landlordId: '',
    coordinates: '',
    location: '',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editMeterData, setEditMeterData] = useState<Meter | null>(null);
  const [editFormData, setEditFormData] = useState({
    plotNumber: '',
    location: '',
    coordinates: '',
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewMeterData, setViewMeterData] = useState<Meter | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metersResponse, usersResponse] = await Promise.all([
        metersAPI.getAll(),
        authAPI.getAllUsers()
      ]);
      
      setMeters(metersResponse.meters);
      setLandlords(usersResponse.users.filter(user => user.role === 'LANDLORD'));
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

    try {
      await metersAPI.create({
        meterNumber: formData.meterNumber,
        plotNumber: formData.plotNumber,
        landlordId: formData.landlordId,
        coordinates: formData.coordinates || undefined,
        location: formData.location || undefined,
      });

      setFormData({
        meterNumber: '',
        plotNumber: '',
        landlordId: '',
        coordinates: '',
        location: '',
      });
      setShowModal(false);
      await loadData();
    } catch (error: any) {
      setFormError(error.response?.data?.error || 'Error creating meter');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setFormData({
      meterNumber: '',
      plotNumber: '',
      landlordId: '',
      coordinates: '',
      location: '',
    });
  };

  const handleViewMeter = (meter: Meter) => {
    setViewMeterData(meter);
    setViewModal(true);
  };

  const handleEditMeter = (meter: Meter) => {
    setEditMeterData(meter);
    setEditFormData({
      plotNumber: meter.plotNumber,
      location: meter.location || '',
      coordinates: meter.coordinates || '',
      isActive: meter.isActive,
    });
    setEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeterData) return;

    try {
      setEditLoading(true);
      await metersAPI.update(editMeterData.id, {
        plotNumber: editFormData.plotNumber,
        location: editFormData.location || undefined,
        coordinates: editFormData.coordinates || undefined,
        isActive: editFormData.isActive,
      });
      setEditModal(false);
      await loadData();
    } catch (error: any) {
      console.error('Error updating meter:', error);
      alert(error.response?.data?.error || 'Error updating meter');
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditMeterData(null);
    setEditFormData({
      plotNumber: '',
      location: '',
      coordinates: '',
      isActive: true,
    });
  };

  const closeViewModal = () => {
    setViewModal(false);
    setViewMeterData(null);
  };

  const landlordOptions = landlords.map(landlord => ({
    value: landlord.id,
    label: `${landlord.name || landlord.phoneNumber} (${landlord.phoneNumber})`
  }));

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meter Management</h1>
            <p className="text-gray-600">Manage electricity meters and their assignments</p>
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Add New Meter
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Meters ({meters.length})</CardTitle>
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
                    <TableHead>Meter Number</TableHead>
                    <TableHead>Plot Number</TableHead>
                    <TableHead>Landlord</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Readings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meters.map((meter) => (
                    <TableRow key={meter.id}>
                      <TableCell className="font-medium">{meter.meterNumber}</TableCell>
                      <TableCell>{meter.plotNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{meter.landlord.name || 'No Name'}</div>
                          <div className="text-sm text-gray-500">{meter.landlord.phoneNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell>{meter.location || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          meter.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {meter.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{meter._count?.readings || 0} readings</div>
                          <div className="text-gray-500">{meter._count?.bills || 0} bills</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewMeter(meter)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditMeter(meter)}
                          >
                            Edit
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

        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title="Add New Meter"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Meter Number"
                type="text"
                value={formData.meterNumber}
                onChange={(e) => setFormData({ ...formData, meterNumber: e.target.value })}
                placeholder="e.g., MTR-001234"
                required
              />

              <Input
                label="Plot Number"
                type="text"
                value={formData.plotNumber}
                onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                placeholder="e.g., PLOT-567"
                required
              />
            </div>

            <Select
              label="Assign to Landlord"
              value={formData.landlordId}
              onChange={(e) => setFormData({ ...formData, landlordId: e.target.value })}
              options={landlordOptions}
              required
            />

            <Input
              label="Location (Optional)"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Building A, Floor 2, Apartment 203"
            />

            <Input
              label="GPS Coordinates (Optional)"
              type="text"
              value={formData.coordinates}
              onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
              placeholder="e.g., -1.2921, 36.8219"
            />

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
                {formLoading ? 'Creating...' : 'Create Meter'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Meter Modal */}
        <Modal
          isOpen={viewModal}
          onClose={closeViewModal}
          title="Meter Details"
          size="lg"
        >
          {viewMeterData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meter Number</label>
                  <p className="text-lg font-semibold">{viewMeterData.meterNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plot Number</label>
                  <p className="text-lg font-semibold">{viewMeterData.plotNumber}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landlord</label>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="font-medium">{viewMeterData.landlord.name || 'No Name'}</p>
                  <p className="text-sm text-gray-600">{viewMeterData.landlord.phoneNumber}</p>
                  <p className="text-xs text-gray-500 capitalize">{viewMeterData.landlord.role.toLowerCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <p>{viewMeterData.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GPS Coordinates</label>
                  <p>{viewMeterData.coordinates || 'Not specified'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    viewMeterData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {viewMeterData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Readings</label>
                  <p className="text-lg font-semibold">{viewMeterData._count?.readings || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Bills</label>
                  <p className="text-lg font-semibold">{viewMeterData._count?.bills || 0}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <p>{new Date(viewMeterData.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Meter Modal */}
        <Modal
          isOpen={editModal}
          onClose={closeEditModal}
          title="Edit Meter"
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-sm text-gray-600">
                <strong>Meter Number:</strong> {editMeterData?.meterNumber} (cannot be changed)
              </p>
              <p className="text-sm text-gray-600">
                <strong>Landlord:</strong> {editMeterData?.landlord.name || editMeterData?.landlord.phoneNumber} (cannot be changed)
              </p>
            </div>

            <Input
              label="Plot Number"
              type="text"
              value={editFormData.plotNumber}
              onChange={(e) => setEditFormData({ ...editFormData, plotNumber: e.target.value })}
              placeholder="e.g., PLOT-567"
              required
            />

            <Input
              label="Location"
              type="text"
              value={editFormData.location}
              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              placeholder="e.g., Building A, Floor 2, Apartment 203"
            />

            <Input
              label="GPS Coordinates"
              type="text"
              value={editFormData.coordinates}
              onChange={(e) => setEditFormData({ ...editFormData, coordinates: e.target.value })}
              placeholder="e.g., -1.2921, 36.8219"
            />

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Meter is Active</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={editLoading}>
                {editLoading ? 'Updating...' : 'Update Meter'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </SidebarLayout>
  );
};

export default Meters;