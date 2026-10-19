import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import styles from './orders.module.css';

export const dynamic = 'force-dynamic';

interface OrderConfirmationPageProps {
  params: {
    orderNumber: string;
  };
  searchParams: {
    success?: string;
  };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const { orderNumber } = params;
  const isSuccess = searchParams.success === 'true';

  const orderRaw = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!orderRaw) {
    notFound();
  }

  const order = {
    ...orderRaw,
    subtotal: Number(orderRaw.subtotal),
    shippingAmount: Number(orderRaw.shippingAmount),
    taxAmount: Number(orderRaw.taxAmount),
    discountAmount: Number(orderRaw.discountAmount),
    totalAmount: Number(orderRaw.totalAmount),
    items: orderRaw.items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
    })),
  };

  const address = order.shippingAddress as any;

  return (
    <div className={styles.container}>
      <header className={styles.successHeader}>
        <div className={styles.checkBadge}>✓</div>
        <h1 className={styles.title}>
          {isSuccess ? 'Thank you for your order!' : 'Order Summary'}
        </h1>
        <p className={styles.subtitle}>
          Confirmation and dispatch updates sent to <strong>{order.customerEmail}</strong>.
        </p>
      </header>

      <div className={styles.orderCard}>
        <div className={styles.cardHeader}>
          <div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Order Reference</span>
            <div className={styles.orderNumber}>{order.orderNumber}</div>
          </div>
          <span
            className={`${styles.statusPill} ${
              order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PROCESSING'
                ? styles.statusConfirmed
                : ''
            }`}
          >
            {order.orderStatus}
          </span>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailBlock}>
            <h4>Shipping Destination</h4>
            <p>
              {order.customerName}
              <br />
              {address?.addressLine1}
              {address?.addressLine2 && <><br />{address.addressLine2}</>}
              <br />
              {address?.city}, {address?.state} {address?.postalCode}
              <br />
              {address?.countryCode}
            </p>
          </div>

          <div className={styles.detailBlock}>
            <h4>Shipping Method</h4>
            <p>
              {order.shippingMethod === 'EXPRESS' ? 'Priority Express (1-2 days)' : 'Standard Delivery (3-5 days)'}
              <br />
              Payment Status: <strong>{order.paymentStatus}</strong>
            </p>
          </div>
        </div>

        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.titleSnapshot}</strong>
                  {item.variantOptions && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.variantOptions}
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <div className={styles.costRow}>
            <span>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className={styles.costRow}>
            <span>Shipping</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {order.shippingAmount === 0 ? 'FREE' : formatCurrency(order.shippingAmount)}
            </span>
          </div>
          <div className={styles.costRow}>
            <span>Tax</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(order.taxAmount)}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Total Paid</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link href="/catalog">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
