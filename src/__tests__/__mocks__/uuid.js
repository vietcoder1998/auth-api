// Mock UUID module for Jest testing
module.exports = {
  v4: () => 'mock-uuid-123456789',
  v1: () => 'mock-uuid-v1-123456789',
  validate: () => true,
  version: () => 4,
};