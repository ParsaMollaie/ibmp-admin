import {
  getPriceInquiries,
  updatePriceInquiry,
} from '@/services/price-inquiry';
import {
  createPriceInquiryNote,
  deletePriceInquiryNote,
  getPriceInquiryNotes,
} from '@/services/price-inquiry-notes';
import {
  getProjectVisitRequests,
  updateProjectVisitRequest,
} from '@/services/project-visit-request';
import {
  createProjectVisitRequestNote,
  deleteProjectVisitRequestNote,
  getProjectVisitRequestNotes,
} from '@/services/project-visit-request-notes';
import type { ProColumns } from '@ant-design/pro-components';
import { Descriptions, Tabs } from 'antd';
import React from 'react';
import LeadsTable from './components/LeadsTable';

const projectVisitExtraColumns: ProColumns<API.ProjectVisitRequestItem>[] = [
  {
    title: 'آدرس پروژه',
    dataIndex: 'project_address',
    hideInSearch: true,
    width: 180,
    ellipsis: true,
  },
];

const renderProjectVisitExtraDetails = (
  record: API.ProjectVisitRequestItem,
) => (
  <>
    <Descriptions.Item label="آدرس پروژه">
      {record.project_address}
    </Descriptions.Item>
    {record.preferred_date && (
      <Descriptions.Item label="تاریخ ترجیحی">
        {record.preferred_date}
      </Descriptions.Item>
    )}
    {record.preferred_time && (
      <Descriptions.Item label="ساعت ترجیحی">
        {record.preferred_time}
      </Descriptions.Item>
    )}
  </>
);

const LeadsPage: React.FC = () => {
  return (
    <Tabs
      defaultActiveKey="project-visits"
      items={[
        {
          key: 'project-visits',
          label: 'درخواست‌های بازدید از پروژه',
          children: (
            <LeadsTable<API.ProjectVisitRequestItem>
              storageKey="leads-project-visits-page-size"
              headerTitle="درخواست‌های بازدید از پروژه"
              searchPlaceholder="جستجو در نام، موبایل، عنوان پروژه یا آدرس..."
              extraColumns={projectVisitExtraColumns}
              renderExtraDetails={renderProjectVisitExtraDetails}
              fetchList={getProjectVisitRequests}
              updateStatus={(id, data) => updateProjectVisitRequest(id, data)}
              fetchNotes={getProjectVisitRequestNotes}
              createNote={createProjectVisitRequestNote}
              deleteNote={deleteProjectVisitRequestNote}
            />
          ),
        },
        {
          key: 'price-inquiries',
          label: 'درخواست‌های استعلام قیمت',
          children: (
            <LeadsTable<API.PriceInquiryItem>
              storageKey="leads-price-inquiries-page-size"
              headerTitle="درخواست‌های استعلام قیمت"
              searchPlaceholder="جستجو در نام، موبایل یا عنوان پروژه..."
              fetchList={getPriceInquiries}
              updateStatus={(id, data) => updatePriceInquiry(id, data)}
              fetchNotes={getPriceInquiryNotes}
              createNote={createPriceInquiryNote}
              deleteNote={deletePriceInquiryNote}
            />
          ),
        },
      ]}
    />
  );
};

export default LeadsPage;
