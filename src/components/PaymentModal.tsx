import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Select from './ui/Select';
import Input from './ui/Input';
import { Bill } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onConfirm: (paymentData: {
    paymentMethod: 'BANK_TRANSACTION' | 'MPESA' | 'CASH';
    paymentReference: string;
  }) => void;
  loading?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  bill, 
  onConfirm, 
  loading = false 
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSACTION' | 'MPESA' | 'CASH'>('MPESA');
  const [paymentReference, setPaymentReference] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const paymentMethodOptions = [
    { value: 'MPESA', label: 'M-Pesa' },
    { value: 'BANK_TRANSACTION', label: 'Bank Transaction' },
    { value: 'CASH', label: 'Cash Payment' },
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    if (!paymentReference.trim()) {
      newErrors.paymentReference = 'Payment reference is required';
    } else if (paymentReference.trim().length < 3) {
      newErrors.paymentReference = 'Payment reference must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm({
        paymentMethod,
        paymentReference: paymentReference.trim(),
      });
    }
  };

  const handleClose = () => {
    setPaymentMethod('MPESA');
    setPaymentReference('');
    setErrors({});
    onClose();
  };

  const getPlaceholderText = () => {
    switch (paymentMethod) {
      case 'MPESA':
        return 'e.g., QDZ8M123AB (M-Pesa transaction code)';
      case 'BANK_TRANSACTION':
        return 'e.g., TXN123456789 (Bank transaction number)';
      case 'CASH':
        return 'e.g., CASH-001-2024 (Receipt number)';
      default:
        return 'Enter reference number';
    }
  };

  const getHelperText = () => {
    switch (paymentMethod) {
      case 'MPESA':
        return 'Enter the M-Pesa transaction confirmation code';
      case 'BANK_TRANSACTION':
        return 'Enter the bank transaction or reference number';
      case 'CASH':
        return 'Enter the cash receipt number or reference';
      default:
        return '';
    }
  };

  const formatKES = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Payment"
      size="md"
    >
      {bill && (
        <div className="space-y-6">
          {/* Bill Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Bill Number:</span>
                <span className="ml-2 font-medium">{bill.billNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Meter:</span>
                <span className="ml-2 font-medium">{bill.meter.meterNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Landlord:</span>
                <span className="ml-2 font-medium">{bill.landlord.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-bold text-green-600">{formatKES(bill.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method *
              </label>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                options={paymentMethodOptions}
                error={errors.paymentMethod}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Reference *
              </label>
              <Input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder={getPlaceholderText()}
                error={errors.paymentReference}
              />
              {getHelperText() && (
                <p className="mt-1 text-sm text-gray-500">{getHelperText()}</p>
              )}
            </div>

            {/* Payment Date Info */}
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Payment Date:</strong> {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                The current date and time will be recorded as the payment date.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Recording Payment...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
};

export default PaymentModal;