// Gateway drivers the backend supports (PaymentGatewayResolver::DRIVERS).
export const DRIVER_OPTIONS: {
  label: string;
  value: API.PaymentGatewayDriver;
}[] = [{ label: 'زرین‌پال', value: 'zarinpal' }];

export const DRIVER_LABELS: Record<string, string> = Object.fromEntries(
  DRIVER_OPTIONS.map((option) => [option.value, option.label]),
);
