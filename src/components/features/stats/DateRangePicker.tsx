import React from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange }) => {
  return (
    <div className="flex gap-2 items-center mb-4">
      <label className="text-sm font-medium">Desde:</label>
      <input
        type="date"
        value={startDate.slice(0, 10)}
        onChange={e => onChange(e.target.value + 'T00:00:00Z', endDate)}
        className="rounded border px-2 py-1 text-sm"
      />
      <label className="text-sm font-medium">Hasta:</label>
      <input
        type="date"
        value={endDate.slice(0, 10)}
        onChange={e => onChange(startDate, e.target.value + 'T23:59:59Z')}
        className="rounded border px-2 py-1 text-sm"
      />
    </div>
  );
};

export default DateRangePicker;
