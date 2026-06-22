const store = new Map<string, string>()

const mockMMKVInstance = {
  getString: jest.fn((key: string) => store.get(key)),
  set: jest.fn((key: string, value: string) => store.set(key, value)),
  remove: jest.fn((key: string) => store.delete(key)),
  addOnValueChangedListener: jest.fn(() => ({ remove: jest.fn() })),
}

export const createMMKV = jest.fn(() => mockMMKVInstance)
