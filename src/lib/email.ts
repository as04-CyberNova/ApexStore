export interface EmailOrderItem {
  titleSnapshot: string;
  skuSnapshot: string;
  variantOptions?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderConfirmationEmailPayload {
  to: string;
  orderNumber: string;
  customerName: string;
  items: EmailOrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
  };
}

export interface ShippingUpdateEmailPayload {
  to: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  carrier?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Clean, luxury-editorial HTML template for ApexStore Order Confirmation
 */
export function generateOrderConfirmationHtml(payload: OrderConfirmationEmailPayload): string {
  const itemsHtml = payload.items
    .map(
      (item) => `
        <tr style="border-bottom: 1px solid #27272a;">
          <td style="padding: 16px 0; vertical-align: top;">
            <div style="font-weight: 500; font-size: 14px; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${item.titleSnapshot}
            </div>
            <div style="font-size: 12px; color: #a1a1aa; margin-top: 4px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              ${item.variantOptions} · SKU: ${item.skuSnapshot}
            </div>
          </td>
          <td style="padding: 16px 0; text-align: center; color: #a1a1aa; font-size: 13px; font-variant-numeric: tabular-nums;">
            ×${item.quantity}
          </td>
          <td style="padding: 16px 0; text-align: right; color: #f4f4f5; font-size: 14px; font-weight: 500; font-family: monospace; font-variant-numeric: tabular-nums;">
            $${item.totalPrice.toFixed(2)}
          </td>
        </tr>
      `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ApexStore Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #121215; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; padding: 40px 32px;">
          <!-- Header -->
          <tr>
            <td align="left" style="border-bottom: 1px solid #27272a; padding-bottom: 24px;">
              <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #ffffff;">
                APEX<span style="color: #d4af37;">STORE</span>
              </div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-top: 4px;">
                Direct-to-Consumer Editorial Luxury
              </div>
            </td>
          </tr>

          <!-- Salutation & Status -->
          <tr>
            <td style="padding-top: 28px;">
              <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #d4af37; font-weight: 600;">
                Order Confirmed
              </div>
              <h1 style="font-size: 24px; font-weight: 600; margin: 8px 0 16px 0; color: #ffffff;">
                Thank you for your order, ${payload.customerName}.
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0;">
                We have received your order <strong>${payload.orderNumber}</strong>. Our fulfillment team is carefully preparing your items for delivery.
              </p>
            </td>
          </tr>

          <!-- Itemized Table -->
          <tr>
            <td style="padding-top: 28px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <thead>
                  <tr style="border-bottom: 1px solid #27272a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">
                    <th align="left" style="padding-bottom: 8px;">Item</th>
                    <th align="center" style="padding-bottom: 8px; width: 60px;">Qty</th>
                    <th align="right" style="padding-bottom: 8px; width: 90px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown -->
          <tr>
            <td style="padding-top: 20px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; line-height: 2; color: #a1a1aa;">
                <tr>
                  <td>Subtotal</td>
                  <td align="right" style="font-family: monospace; color: #f4f4f5; font-variant-numeric: tabular-nums;">$${payload.subtotal.toFixed(2)}</td>
                </tr>
                ${
                  payload.discountAmount > 0
                    ? `
                <tr>
                  <td style="color: #34d399;">Promotional Discount</td>
                  <td align="right" style="font-family: monospace; color: #34d399; font-variant-numeric: tabular-nums;">-$${payload.discountAmount.toFixed(2)}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td>Shipping</td>
                  <td align="right" style="font-family: monospace; color: #f4f4f5; font-variant-numeric: tabular-nums;">
                    ${payload.shippingAmount === 0 ? 'FREE' : `$${payload.shippingAmount.toFixed(2)}`}
                  </td>
                </tr>
                <tr>
                  <td>Estimated Tax</td>
                  <td align="right" style="font-family: monospace; color: #f4f4f5; font-variant-numeric: tabular-nums;">$${payload.taxAmount.toFixed(2)}</td>
                </tr>
                <tr style="border-top: 1px solid #27272a; font-size: 15px; font-weight: 600; color: #ffffff;">
                  <td style="padding-top: 12px;">Total Paid</td>
                  <td align="right" style="padding-top: 12px; font-family: monospace; color: #d4af37; font-size: 17px; font-variant-numeric: tabular-nums;">
                    $${payload.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding-top: 32px; border-top: 1px solid #27272a;">
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 8px;">
                Shipping Destination
              </div>
              <div style="font-size: 14px; line-height: 1.5; color: #f4f4f5;">
                ${payload.shippingAddress.fullName}<br>
                ${payload.shippingAddress.addressLine1}
                ${payload.shippingAddress.addressLine2 ? `<br>${payload.shippingAddress.addressLine2}` : ''}<br>
                ${payload.shippingAddress.city}, ${payload.shippingAddress.state} ${payload.shippingAddress.postalCode}<br>
                ${payload.shippingAddress.countryCode}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; border-top: 1px solid #27272a; text-align: center; font-size: 12px; color: #52525b;">
              Questions regarding your order? Contact <a href="mailto:support@apexstore.com" style="color: #a1a1aa; text-decoration: underline;">support@apexstore.com</a>.<br>
              © ${new Date().getFullYear()} ApexStore Inc. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Editorial HTML template for Shipping Confirmation with Tracking
 */
export function generateShippingUpdateHtml(payload: ShippingUpdateEmailPayload): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ApexStore Order Shipped</title>
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f4f4f5;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #121215; border: 1px solid #27272a; border-radius: 8px; padding: 40px 32px;">
          <tr>
            <td align="left" style="border-bottom: 1px solid #27272a; padding-bottom: 24px;">
              <div style="font-size: 20px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #ffffff;">
                APEX<span style="color: #d4af37;">STORE</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 28px;">
              <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #34d399; font-weight: 600;">
                Package In Transit
              </div>
              <h1 style="font-size: 24px; font-weight: 600; margin: 8px 0 16px 0; color: #ffffff;">
                Your order ${payload.orderNumber} is on the way.
              </h1>
              <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0;">
                Hello ${payload.customerName}, your items have been packaged and dispatched.
              </p>
              <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a;">Tracking Number</div>
                <div style="font-family: monospace; font-size: 16px; color: #f4f4f5; font-weight: 600; margin-top: 4px;">
                  ${payload.trackingNumber}
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Resend Email Dispatcher with retries, timeout, and graceful non-blocking failure
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_SENDER_ADDRESS || 'ApexStore <orders@apexstore.com>';

  // Graceful development sandbox fallback
  if (!apiKey || apiKey.startsWith('re_sample') || apiKey === 'mock') {
    console.log(`[Resend Mock Dispatch] Simulated delivery to ${to} with subject: "${subject}"`);
    return {
      success: true,
      id: `sim_email_${Date.now()}`,
      skipped: true,
    };
  }

  const maxRetries = 2;
  const timeoutMs = 8000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to,
          subject,
          html,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // Handle rate-limits gracefully (HTTP 429)
        if (response.status === 429 && attempt < maxRetries) {
          console.warn(`[Resend Rate Limited] Retrying in 1s (Attempt ${attempt}/${maxRetries})...`);
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        console.error(`[Resend API Error]: ${response.status}`, data);
        return {
          success: false,
          error: data.message || `Resend API rejected with HTTP ${response.status}`,
        };
      }

      return {
        success: true,
        id: data.id,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);

      const isTimeout = err.name === 'AbortError';
      const errorMessage = isTimeout ? 'Email dispatch request timed out after 8s' : err.message;

      if (attempt < maxRetries) {
        console.warn(`[Resend Dispatch Failed]: ${errorMessage}. Retrying (Attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      console.error(`[Resend Permanent Failure]: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  return { success: false, error: 'Max retries exhausted' };
}
