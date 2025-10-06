type ArrayOptions = { count: number; min?: never; max?: never } | { count?: never; min: number; max: number };

interface ArrayGenerator<T> {
  _type: 'array';
  definition: GeneratorOrDefinition<T>;
  options: ArrayOptions;
}

export type GeneratorFunction<T> = () => T;
export type GeneratorOrDefinition<T> = T extends (infer U)[]
  ? ArrayGenerator<U>
  : T extends object
  ? MockDefinition<T>
  : GeneratorFunction<T>;

export type MockDefinition<T> = {
  [K in keyof T]: GeneratorOrDefinition<T[K]>;
};

export interface MockFactoryRef<T extends object> {
  generate(count: number, override?: Partial<T>[]): T[];
}

export class MocksFactoryImpl<T extends object> implements MockFactoryRef<T> {
  constructor(private definition: MockDefinition<T>) {}

  generate(count: number, overrides?: Partial<T>[]): T[] {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      const item = overrides ? this.generateMock(overrides[i] || {}) : this.generateMock();
      result.push(item);
    }
    return result;
  }

  private generateMock(override?: Partial<T>): T {
    const item = {} as T;

    for (const key in this.definition) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      (item[key] as any) = this.generateValue(this.definition[key]);
    }

    if (override) {
      Object.assign(item, override);
    }
    return item;
  }

  private generateValue<V>(def: GeneratorOrDefinition<V>): V {
    if (typeof def === 'object' && def !== null && '_type' in def && def._type === 'array') {
      const arrayDef = def as ArrayGenerator<unknown>;
      const result = [] as unknown[];

      const length =
        arrayDef.options.count !== undefined
          ? arrayDef.options.count
          : Math.floor(Math.random() * (arrayDef.options.max - arrayDef.options.min + 1)) + arrayDef.options.min;

      for (let i = 0; i < length; i++) {
        result.push(this.generateValue(arrayDef.definition));
      }

      return result as V;
    }

    if (typeof def === 'function') {
      return def();
    }

    const result = {} as V;
    for (const key in def) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      (result[key as keyof V] as any) = this.generateValue(def[key] as GeneratorOrDefinition<any>);
    }
    return result;
  }
}

export function array<T>(definition: GeneratorOrDefinition<T>, options: ArrayOptions): ArrayGenerator<T> {
  return {
    _type: 'array',
    definition,
    options,
  };
}

export function autoIncrement(start = 0): GeneratorFunction<number> {
  let current = start;
  return () => current++;
}

type ExtractLiteralUnion<T> = T extends GeneratorFunction<infer L> ? L : never;

export function literal<
  TProps extends GeneratorFunction<string | number | boolean>,
  L extends ExtractLiteralUnion<TProps>,
  LSub extends L
>(items: LSub[]): TProps {
  const generator = () => items[Math.floor(Math.random() * items.length)] as LSub;
  return generator as unknown as TProps;
}

export function value<T>(val: T): GeneratorFunction<T> {
  return () => val;
}

export function range(min: number, max: number): GeneratorFunction<number> {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
}

export function boolean(chanceTrue = 0.5): GeneratorFunction<boolean> {
  return () => Math.random() < chanceTrue;
}

export function lorem(wordCount = 3): GeneratorFunction<string> {
  const loremWords = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua',
  ];
  return () => {
    const result = [];
    for (let i = 0; i < wordCount; i++) {
      const word = loremWords[Math.floor(Math.random() * loremWords.length)];
      result.push(word);
    }
    return result.join(' ');
  };
}
