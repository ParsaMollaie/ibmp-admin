/**
 * Debounces an async function so only the trailing call within the delay window actually
 * executes — earlier calls resolve with `undefined` instead of being left hanging, which
 * matters for antd Form.Item async validators (each keystroke re-triggers the validator).
 */
export function debouncePromise<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  delay: number,
): (...args: Args) => Promise<R | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolveLatest: ((value: R | undefined) => void) | undefined;

  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    resolveLatest?.(undefined);

    return new Promise<R | undefined>((resolve) => {
      resolveLatest = resolve;
      timer = setTimeout(() => {
        resolveLatest = undefined;
        fn(...args).then(resolve);
      }, delay);
    });
  };
}
