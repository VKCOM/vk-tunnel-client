import pino from 'pino';
import pinoPretty from 'pino-pretty';

export const logger = pino(
  {
    level: 'info',
    base: {},
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pinoPretty({
    colorize: true,
  }),
);
