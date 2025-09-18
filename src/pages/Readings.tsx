import React, { useState, useEffect } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { readingsAPI, metersAPI, settingsAPI } from '../services/api';
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
  const [photo, setPhoto] = useState<File | null>(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | undefined>(undefined);
  const [kwhRate, setKwhRate] = useState<string>('');
  const [filterMeterId, setFilterMeterId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  useEffect(() => {
    loadData();
    // Load KWh rate for context
    (async () => {
      try {
        const r = await settingsAPI.getKwhRate();
        setKwhRate(r.value);
      } catch {}
    })();
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

    if (!photo) {
      setFormError('A meter photo is required');
      setFormLoading(false);
      return;
    }

    try {
      const response = await readingsAPI.create({
        meterId: formData.meterId,
        reading: parseFloat(formData.reading),
        photo,
      });

      setFormData({ meterId: '', reading: '' });
      setPhoto(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
        setPhotoPreviewUrl(null);
      }
      
      if (response.bill) {
        setSuccessMessage(
          `Reading recorded successfully! A bill of KES ${response.bill.totalAmount.toFixed(2)} has been generated for ${response.bill.unitsConsumed} units consumed.`
        );
      } else {
        setSuccessMessage('Reading recorded successfully!');
      }
      
      await loadData();
    } catch (error: any) {
      const apiMsg = error?.response?.data?.error || error?.response?.data?.errors?.[0]?.msg;
      setFormError(apiMsg || 'Error recording reading');
    } finally {
      setFormLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError('');
    setSuccessMessage(null);
    setFormData({ meterId: '', reading: '' });
    setPhoto(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
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
  const filteredReadings = readings.filter((r) => {
    if (filterMeterId && r.meter && (formData.meterId || true)) {
      // r.meterNumber not available; cannot map id → meter easily from r; since backend includes meter info only, compare by meterNumber via selected meter option
    }
    const meterPass = filterMeterId ? (r.meter && filterMeterId === meters.find(m=>m.meterNumber===r.meter.meterNumber)?.id) : true;
    const startPass = filterStartDate ? new Date(r.readingDate) >= new Date(filterStartDate) : true;
    const endPass = filterEndDate ? new Date(r.readingDate) <= new Date(filterEndDate + 'T23:59:59') : true;
    return meterPass && startPass && endPass;
  });

  const exportCsv = () => {
    const rows = [
      ['Meter Number','Plot','Reading','Previous','Units','Technician','Phone','Date','Photo URL'],
      ...filteredReadings.map(r => [
        r.meter.meterNumber,
        r.meter.plotNumber,
        r.reading.toString(),
        r.previousReading?.toString() || '',
        (r.unitsConsumed || 0).toString(),
        r.technician.name || 'Technician',
        r.technician.phoneNumber,
        new Date(r.readingDate).toISOString(),
        getPhotoUrl(r.photoPath)
      ])
    ];
    const csv = rows.map(cols => cols.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readings-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const apiBase = (process.env.REACT_APP_API_URL || 'http://localhost:3001/api');
  const filesBase = apiBase.replace(/\/api$/, '');
  const getPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return '';
    if (/^https?:\/\//i.test(photoPath)) return photoPath;
    return `${filesBase}/${photoPath}`;
  };

  const handlePhotoSelect: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    if (file && file.size > 5 * 1024 * 1024) {
      setFormError('Image is larger than 5MB. Please choose a smaller photo.');
      e.target.value = '';
      return;
    }
    setPhoto(file);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(null);
    }
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrl(url);
    }
  };

  const openLightbox = (src: string) => {
    setLightboxSrc(src);
    setLightboxOpen(true);
  };

  return (
    <>
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
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Recent Readings</CardTitle>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterMeterId}
                  onChange={(e)=>setFilterMeterId(e.target.value)}
                  className="input h-9"
                >
                  <option value="">All meters</option>
                  {meters.map(m => (
                    <option key={m.id} value={m.id}>{m.meterNumber} - {m.plotNumber}</option>
                  ))}
                </select>
                <input type="date" value={filterStartDate} onChange={(e)=>setFilterStartDate(e.target.value)} className="input h-9" />
                <input type="date" value={filterEndDate} onChange={(e)=>setFilterEndDate(e.target.value)} className="input h-9" />
                <Button variant="outline" onClick={()=>{setFilterMeterId('');setFilterStartDate('');setFilterEndDate('');}}>Clear</Button>
                <Button onClick={exportCsv}>Export CSV</Button>
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
                    <TableHead>Meter</TableHead>
                    <TableHead>Plot</TableHead>
                    <TableHead>Current Reading</TableHead>
                    <TableHead>Previous Reading</TableHead>
                    <TableHead>Units Consumed</TableHead>
                    <TableHead>Photo</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReadings.map((reading) => (
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
                        {reading.photoPath ? (
                          <button type="button" onClick={() => openLightbox(getPhotoUrl(reading.photoPath))} className="focus:outline-none">
                            <img
                              src={getPhotoUrl(reading.photoPath)}
                              alt="Meter reading"
                              className="h-12 w-12 object-cover rounded border hover:opacity-90"
                              loading="lazy"
                            />
                          </button>
                        ) : (
                          <span className="text-gray-400">No photo</span>
                        )}
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
                {kwhRate && (
                  <p className="text-xs text-green-700 mt-2">Using rate: KES {parseFloat(kwhRate).toFixed(2)} per KWh</p>
                )}
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

              {kwhRate && (
                <p className="text-xs text-gray-500">Current rate: <span className="font-medium">KES {parseFloat(kwhRate).toFixed(2)}/KWh</span></p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Reading Photo</label>
                <input
                  type="file"
                  accept="image/*;capture=camera"
                  onChange={handlePhotoSelect}
                  required
                  className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">Upload or take a clear photo of the meter. Max 5MB.</p>

                {photoPreviewUrl && (
                  <div className="mt-3 flex items-center gap-2">
                    <img
                      src={photoPreviewUrl}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPhoto(null);
                        URL.revokeObjectURL(photoPreviewUrl);
                        setPhotoPreviewUrl(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

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
    {/* Lightbox Modal */}
    <Modal isOpen={lightboxOpen} onClose={() => { setLightboxOpen(false); setLightboxSrc(undefined); }} title="Photo" size="lg">
      {lightboxSrc && (
        <div className="flex flex-col gap-3">
          <img src={lightboxSrc} alt="Reading" className="w-full max-h-[75vh] object-contain" />
          <div className="flex justify-end">
            <a href={lightboxSrc} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">Open original</a>
          </div>
        </div>
      )}
    </Modal>
    </>
  );
};

export default Readings;