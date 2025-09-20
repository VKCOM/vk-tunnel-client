import net from 'net';

export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(0, () => {
      const address = server.address();

      if (typeof address === 'object' && address?.port) {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error('Не удалось получить свободный порт'));
      }
    });

    server.on('error', reject);
  });
}
