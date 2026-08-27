import { Button, Card, Space, message } from 'antd';
import { DatePicker } from 'antd-jalali';
import type { Dayjs } from 'dayjs';
import React, { useState } from 'react';

interface DateRangeFilterProps {
  defaultStart: Dayjs;
  defaultEnd: Dayjs;
  onApply: (start: Dayjs, end: Dayjs) => void;
  loading?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  defaultStart,
  defaultEnd,
  onApply,
  loading,
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

  return (
    <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
      <Space size="large" wrap align="end">
        <div>
          <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>
            از تاریخ
          </div>
          <DatePicker
            value={pendingStartDate}
            onChange={(date: Dayjs | null) => setPendingStartDate(date)}
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
            onChange={(date: Dayjs | null) => setPendingEndDate(date)}
            format="YYYY/MM/DD"
            allowClear={false}
            style={{ width: 160 }}
          />
        </div>
        <Button type="primary" onClick={handleApply} loading={loading}>
          اعمال
        </Button>
      </Space>
    </Card>
  );
};

export default DateRangeFilter;
