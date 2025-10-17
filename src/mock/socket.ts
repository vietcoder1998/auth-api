// Mock socket events for testing
import { mockSocketWithDb, SocketConfig } from '../services/socket.service';

const mockConfig: SocketConfig = {
  id: 'mock-socket',
  name: 'Mock Socket',
  host: 'localhost',
  port: 4001,
  enabled: true,
};

const mockEvents = [
  { type: 'user_joined', payload: { userId: '1', name: 'Alice' } },
  { type: 'user_left', payload: { userId: '2', name: 'Bob' } },
  { type: 'message', payload: { text: 'Hello from mock socket!' } },
];

mockSocketWithDb(mockConfig, mockEvents);

console.log('Mock socket running on port', mockConfig.port);
