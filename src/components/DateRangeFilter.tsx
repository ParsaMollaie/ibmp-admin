import { Button, Card, Space, message } from 'antd';
import { DatePicker } from 'antd-jalali';
import type { Dayjs } from 'dayjs';
import React, { useState } from 'react';

interface DateRangeFilterProps {
  defaultStart: Dayjs;
  defaultEnd: Dayjs;
  onApply: (start: Dayjs, end: Dayjs) => void;
  loading?: boolean;
  /** Fired on every date change, in addition to (not instead of) onApply — lets a
   * parent track the currently-picked-but-not-yet-applied values, e.g. to combine
   * them with other filters behind a single external "apply" button. */
  onChange?: (start: Dayjs | null, end: Dayjs | null) => void;
  /** Hides this component's own "اعمال" button — use when a parent provides a
   * single unified apply button covering this date range plus other filters. */
  hideApplyButton?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  defaultStart,
  defaultEnd,
  onApply,
  loading,
  onChange,
  hideApplyButton,
}) => {
  const [pendingStartDate, setPendingStartDate] = useState<Dayjs | null>(
    defaultStart,
  );
  const [pendingEndDate, setPendingEndDate] = useState<Dayjs | null>(
    defaultEnd,
  );

  const handleApply = () => {
    if (!pendingStartDate || !pendingEndDate) {
      message.warning('لطفاً هر دو تاریخ را انتخاب کنید.');
      return;
    }
    if (pendingEndDate.isBefore(pendingStartDate)) {
      message.warning('تاریخ پایان باید بعد از تاریخ شروع باشد.');
      return;
    }
    onApply(pendingStartDate, pendingEndDate);
  };

  const handleStartChange = (date: Dayjs | null) => {
    setPendingStartDate(date);
    onChange?.(date, pendingEndDate);
  };

  const handleEndChange = (date: Dayjs | null) => {
    setPendingEndDate(date);
    onChange?.(pendingStartDate, date);
  };

  return (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
      <Space size="large" wrap align="end">
        <div>
          <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>
            از تاریخ
          </div>
          <DatePicker
            value={pendingStartDate}
            onChange={handleStartChange}
            format="YYYY/MM/DD"
            allowClear={false}
            style={{ width: 160 }}
          />
        </div>
        <div>
          <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>
            تا تاریخ
          </div>
          <DatePicker
            value={pendingEndDate}
            onChange={handleEndChange}
            format="YYYY/MM/DD"
            allowClear={false}
            style={{ width: 160 }}
          />
        </div>
        {!hideApplyButton && (
          <Button type="primary" onClick={handleApply} loading={loading}>
            اعمال
          </Button>
        )}
      </Space>
    </Card>
  );
};

export default DateRangeFilter;
