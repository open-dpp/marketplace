import 'reflect-metadata';

jest.mock('@keycloak/keycloak-admin-client', () => {
  return {
    __esModule: true, // Ensure Jest understands it's an ES module
    default: jest.fn(() => ({
      auth: jest.fn().mockResolvedValue(undefined),
      realms: {
        find: jest
          .fn()
          .mockResolvedValue([{ id: 'mock-realm-id', realm: 'test-realm' }]),
      },
    })),
  };
});
