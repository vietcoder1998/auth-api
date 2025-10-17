import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SocketConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  enabled: boolean;
}

let ioInstances: Record<string, Server> = {};

export async function loadSocketConfigs(): Promise<SocketConfig[]> {
  // Example: load from DatabaseConnection table where type = 'socket' and isActive = true
  const configs = await prisma.databaseConnection.findMany({
    where: { type: 'socket', isActive: true },
  });
  return configs.map((c) => ({
    id: c.id,
    name: c.name,
    host: c.host,
    port: c.port,
    enabled: c.isActive,
  }));
}

export function openSocket(config: SocketConfig): Server {
  if (ioInstances[config.id]) return ioInstances[config.id];
  const io = new Server({
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  io.on('connection', (socket: Socket) => {
    socket.emit('message', `Socket ${config.name} connected!`);
    socket.on('disconnect', () => {
      // handle disconnect
    });
  });
  io.listen(config.port);
  ioInstances[config.id] = io;
  return io;
}

export function closeSocket(configId: string) {
  if (ioInstances[configId]) {
    ioInstances[configId].close();
    delete ioInstances[configId];
  }
}

// For mocking: open a socket and emit fake DB events
type MockEvent = { type: string; payload: any };
export function mockSocketWithDb(config: SocketConfig, events: MockEvent[]) {
  const io = openSocket(config);
  setInterval(() => {
    const event = events[Math.floor(Math.random() * events.length)];
    io.emit(event.type, event.payload);
  }, 2000);
  return io;
}
