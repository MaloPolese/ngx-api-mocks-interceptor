import { createRouteCounter, RouteCounterRef } from '../router/router-counter';

describe('RouterCounter', () => {
  let counter: RouteCounterRef;

  beforeEach(() => {
    counter = createRouteCounter();
  });

  it('should create counter with initial value of 0', () => {
    expect(counter.get()).toBe(0);
  });

  it('should increment counter', () => {
    counter.increment();
    expect(counter.get()).toBe(1);
  });

  it('should return previous value when incrementing', () => {
    const previousValue = counter.increment();
    expect(previousValue).toBe(0);
    expect(counter.get()).toBe(1);
  });

  it('should increment multiple times', () => {
    counter.increment();
    counter.increment();
    counter.increment();
    expect(counter.get()).toBe(3);
  });

  it('should reset counter to 0', () => {
    counter.increment();
    counter.increment();
    counter.reset();
    expect(counter.get()).toBe(0);
  });

  it('should create independent counters', () => {
    const counter2 = createRouteCounter();

    counter.increment();
    counter2.increment();
    counter2.increment();

    expect(counter.get()).toBe(1);
    expect(counter2.get()).toBe(2);
  });
});
