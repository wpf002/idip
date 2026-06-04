// Jest mock for react-native-keychain — backed by an in-memory store.
let store = {};

module.exports = {
  setGenericPassword: jest.fn(async (username, password, options = {}) => {
    const service = options.service || 'default';
    store[service] = { username, password };
    return true;
  }),
  getGenericPassword: jest.fn(async (options = {}) => {
    const service = options.service || 'default';
    return store[service] || false;
  }),
  resetGenericPassword: jest.fn(async (options = {}) => {
    const service = options.service || 'default';
    delete store[service];
    return true;
  }),
  __reset: () => {
    store = {};
  },
  ACCESSIBLE: { WHEN_UNLOCKED: 'AccessibleWhenUnlocked' },
};
