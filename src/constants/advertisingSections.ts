/** Shared advertising placement-section options — single source of truth used by the Advertising list, create, and update forms. */
export const sectionLabels: Record<string, string> = {
  main_page_first_section: 'بخش اول صفحه اصلی',
  main_page_second_section: 'بخش دوم صفحه اصلی',
  main_page_third_section: 'بخش سوم صفحه اصلی',
  main_page_fourth_section: 'بخش چهارم صفحه اصلی',
  listing_page_after_promoted_section: 'صفحه لیست - بعد از خدمات ویژه',
  listing_page_after_regular_section: 'صفحه لیست - بعد از خدمات عادی',
  listing_page_after_products_section: 'صفحه لیست - بعد از محصولات',
};

export const sectionOptions = Object.entries(sectionLabels).map(
  ([value, label]) => ({ label, value }),
);
