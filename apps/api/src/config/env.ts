import dotenv from 'dotenv';

dotenv.config({
  path: '../../.env',
  quiet: true,
});

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3333);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535');
  }

  return port;
}

export const env = {
  API_HOST: process.env.API_HOST ?? '0.0.0.0',
  API_PORT: parsePort(process.env.API_PORT),
};