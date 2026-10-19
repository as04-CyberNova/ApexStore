/**
 * Production Structured Logger with PII Masking
 * Conforms strictly to API.md Section 7.2 and AGENTS.md Section 8
 */

export type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

// Fields that must be masked before outputting to logs
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'jwt',
  'clientsecret',
  'secret',
  'authorization',
  'addressline1',
  'phone',
  'card',
  'cvv',
  'apikey',
]);

function maskSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const sanitized: { [key: string]: any } = {};
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof val === 'object') {
      sanitized[key] = maskSensitiveData(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

function outputLog(level: LogLevel, event: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? maskSensitiveData(context) : undefined;

  const logPayload = {
    timestamp,
    level: level.toUpperCase(),
    service: 'apexstore-api',
    event,
    ...(sanitizedContext ? { context: sanitizedContext } : {}),
  };

  const formattedJson = JSON.stringify(logPayload);

  if (level === 'error') {
    console.error(formattedJson);
  } else if (level === 'warn') {
    console.warn(formattedJson);
  } else {
    console.log(formattedJson);
  }
}

export const logger = {
  info: (event: string, context?: LogContext) => outputLog('info', event, context),
  warn: (event: string, context?: LogContext) => outputLog('warn', event, context),
  error: (event: string, context?: LogContext) => outputLog('error', event, context),

  // Critical Business Events Tracking (PRD & SRE SLA)
  orderPlaced: (orderNumber: string, totalAmount: number, itemCount: number) => {
    outputLog('info', 'BUSINESS_EVENT:ORDER_PLACED', {
      orderNumber,
      totalAmount,
      itemCount,
    });
  },

  paymentSettled: (orderNumber: string, paymentIntentId: string) => {
    outputLog('info', 'BUSINESS_EVENT:PAYMENT_SETTLED', {
      orderNumber,
      paymentIntentId,
    });
  },

  stockScarcityTriggered: (variantId: string, sku: string, remainingStock: number) => {
    outputLog('warn', 'INVENTORY_ALERT:LOW_STOCK', {
      variantId,
      sku,
      remainingStock,
    });
  },

  integrationFailed: (service: 'stripe' | 'resend' | 'database', error: string, metadata?: LogContext) => {
    outputLog('error', `INTEGRATION_ERROR:${service.toUpperCase()}`, {
      service,
      errorMessage: error,
      ...metadata,
    });
  },
};
