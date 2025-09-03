import { MockDefinition, MockFactoryRef, MocksFactoryImpl } from './mock-factory';

export interface MockRef<T> {
  value: T;
  update(updaterFn: (value: T) => T): void;
  set(value: T): void;
}

class MockImpl<T extends object> implements MockRef<T> {
  constructor(protected _value: T, protected _factory: MockFactoryRef<T>) {}

  get value(): T {
    return this._value;
  }

  set(value: T): void {
    this._value = value;
  }

  update(updaterFn: (value: T) => T): void {
    this.set(updaterFn(this._value));
  }
}

export interface MocksRef<T> extends MockRef<T[]> {
  /**
   * Retrieves the first item that matches the provided match function.
   * If no item matches, it returns undefined.
   * @param matchFn Function to match the item to be retrieved.
   * @returns The first matching item or undefined if no item matched.
   */
  get(matchFn: (a: T) => boolean): T | undefined;

  /**
   * Adds a new mock item to the collection.
   * The item is generated based on the definition and can be overridden with the provided partial item.
   * @param override Partial item to override the generated mock.
   * @return The newly added mock item.
   */
  add(override: Partial<T>): T;

  /**
   * Removes the first item that matches the provided match function.
   * If no item matches, it returns undefined.
   * @param matchFn Function to match the item to be removed.
   * @returns The removed item or undefined if no item matched.
   */
  remove(matchFn: (a: T) => boolean): T | undefined;
}

class MocksImpl<T extends object> implements MocksRef<T> {
  constructor(protected _value: T[], protected _factory: MockFactoryRef<T>) {}

  get value(): T[] {
    return this._value;
  }

  set(value: T[]): void {
    this._value = value;
  }

  update(updaterFn: (value: T[]) => T[]): void {
    this.set(updaterFn(this._value));
  }

  add(override: Partial<T>): T {
    const newMock = this._factory.generate(1, [override]).pop();
    if (!newMock) {
      throw Error('Error while generating mock... mock undefined');
    }
    this.set(this._value.concat(newMock));

    return newMock;
  }

  remove(matchFn: (a: T) => boolean): T | undefined {
    const index = this._value.findIndex((item) => matchFn(item));
    if (index === -1) {
      return undefined;
    }
    const [removed] = this._value.splice(index, 1);
    return removed;
  }

  get(matchFn: (a: T) => boolean): T | undefined {
    const item = this._value.find((a) => matchFn(a));
    if (!item) {
      return undefined;
    }
    return item;
  }
}

export interface MocksOptions {
  count: number;
}

export function mocks<T extends object>(
  definition: MockDefinition<T>,
  options: MocksOptions = {
    count: 1,
  }
): MocksRef<T> {
  const factory = new MocksFactoryImpl<T>(definition);
  const mocks = factory.generate(options.count);
  return new MocksImpl(mocks, factory);
}

export function mock<T extends object>(definition: MockDefinition<T>): MockRef<T> {
  const factory = new MocksFactoryImpl<T>(definition);
  const mock = factory.generate(1).pop();
  if (!mock) {
    throw Error('Error while generating mock... mock undefined');
  }
  return new MockImpl(mock, factory);
}
