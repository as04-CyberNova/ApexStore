'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/common/Button';
import styles from './[orderNumber]/orders.module.css';

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) {
      router.push(`/orders/${encodeURIComponent(orderNumber.trim())}`);
    }
  };

  return (
    <div className={styles.container} style={{ maxWidth: '580px', textAlign: 'center' }}>
      <header className={styles.successHeader}>
        <h1 className={styles.title}>Track Your Order</h1>
        <p className={styles.subtitle}>
          Enter your ApexStore order number (e.g. APX-20261019-XXXX) to track fulfillment.
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.orderCard}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <input
            type="text"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="APX-..."
            style={{
              padding: 'var(--space-3) var(--space-4)',
              fontSize: '1rem',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <Button type="submit" size="lg">
            Track Order
          </Button>
        </div>
      </form>
    </div>
  );
}
