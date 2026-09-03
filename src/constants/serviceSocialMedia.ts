/** Shared social-media type options for Service and ContactProfile forms — single source of truth replacing 4 hardcoded copies. */
export const socialMediaTypeOptions = [
  { label: 'اینستاگرام', value: 'instagram' },
  { label: 'تلگرام', value: 'telegram' },
  { label: 'ایتا', value: 'eita' },
  { label: 'بله', value: 'bale' },
  { label: 'واتساپ', value: 'whatsapp' },
  { label: 'لینکدین', value: 'linkedin' },
  { label: 'روبیکا', value: 'rubika' },
  { label: 'وب‌سایت', value: 'website' },
];

export const getSocialTypeLabel = (type: string): string => {
  const found = socialMediaTypeOptions.find((option) => option.value === type);
  return found?.label || type;
};
