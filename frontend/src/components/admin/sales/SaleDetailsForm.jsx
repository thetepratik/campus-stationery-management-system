import Input from '../../common/Input';
import Select from '../../common/Select';

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'gpay', label: 'Google Pay' },
  { value: 'phonepe', label: 'PhonePe' },
  { value: 'paytm', label: 'Paytm' },
];

const SaleDetailsForm = ({ details, onChange }) => {
  const update = (patch) => onChange({ ...details, ...patch });

  return (
    <div className="card panel">
      <div className="panel__header">
        <span className="panel__title">Sale Details</span>
      </div>
      <Input
        id="customerName"
        label="Customer Name (optional)"
        placeholder="Rahul Sharma"
        value={details.customerName}
        onChange={(e) => update({ customerName: e.target.value })}
      />
      <div className="flex gap-3">
        <div style={{ flex: 1 }}>
          <Input
            id="rollNumber"
            label="Roll Number (optional)"
            placeholder="23CS345"
            value={details.rollNumber}
            onChange={(e) => update({ rollNumber: e.target.value })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Input
            id="department"
            label="Department (optional)"
            placeholder="Computer Science"
            value={details.department}
            onChange={(e) => update({ department: e.target.value })}
          />
        </div>
      </div>
      <Input
        id="remarks"
        label="Remarks (optional)"
        placeholder="e.g. Bought for project submission"
        value={details.remarks}
        onChange={(e) => update({ remarks: e.target.value })}
      />
      <Select
        id="paymentMethod"
        label="Payment Method"
        value={details.paymentMethod}
        onChange={(e) => update({ paymentMethod: e.target.value })}
        options={PAYMENT_OPTIONS}
      />
    </div>
  );
};

export default SaleDetailsForm;
