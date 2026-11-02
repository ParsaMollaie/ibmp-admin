// Gateway drivers the backend supports (PaymentGatewayResolver::DRIVERS).
export const DRIVER_OPTIONS: {
  label: string;
  value: API.PaymentGatewayDriver;
}[] = [
  { label: 'زرین‌پال', value: 'zarinpal' },
  { label: 'سپ (سامان)', value: 'sep' },
];

// SEP has no test environment, so its gateways are always live.
export const SANDBOX_DRIVERS: API.PaymentGatewayDriver[] = ['zarinpal'];

export const TERMINAL_ID_PATTERN = /^\d{1,20}$/;

export const DRIVER_LABELS: Record<string, string> = Object.fromEntries(
  DRIVER_OPTIONS.map((option) => [option.value, option.label]),
);
