export const createRouteCounter = (): RouteCounterRef => {
  let counter = 0;

  return {
    increment: (): number => counter++,
    get: (): number => counter,
    reset: (): void => {
      counter = 0;
    },
  };
};

export interface RouteCounterRef {
  increment(): number;
  get(): number;
  reset(): void;
}
