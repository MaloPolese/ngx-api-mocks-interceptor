type GeneratorFunction<T> = () => T;

export type MockDefinition<T> = {
  [K in keyof T]: GeneratorOrDefinition<T[K]>;
};

type GeneratorOrDefinition<T> = GeneratorFunction<T> | MockDefinition<T>;

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
      item[key] = this.generateValue(this.definition[key]);
    }

    if (override) {
      Object.assign(item, override);
    }
    return item;
  }

  private generateValue<V>(def: GeneratorOrDefinition<V>): V {
    if (typeof def === 'function') {
      return def();
    }

    const result = {} as V;
    for (const key in def) {
      result[key] = this.generateValue(def[key]);
    }
    return result;
  }
}

export function autoIncrement(start = 0): GeneratorFunction<number> {
  let current = start;
  return () => current++;
}

export function int(min: number, max: number): GeneratorFunction<number> {
  return () => Math.floor(Math.random() * (max - min + 1)) + min;
}

export function boolean(chanceTrue = 0.5): GeneratorFunction<boolean> {
  return () => Math.random() < chanceTrue;
}

export function randomLorem(wordCount = 3): GeneratorFunction<string> {
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
    let result = [];
    for (let i = 0; i < wordCount; i++) {
      const word = loremWords[Math.floor(Math.random() * loremWords.length)];
      result.push(word);
    }
    return result.join(' ');
  };
}
