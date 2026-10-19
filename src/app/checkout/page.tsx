'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, getSubtotal, clearCart } = useCartStore();

  const [formData, setFormData] = useState({
    customerEmail: '',
    customerName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    countryCode: 'US',
    shippingMethod: 'STANDARD',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
        <h1 className={styles.title}>Your cart is empty</h1>
        <p className={styles.subtitle} style={{ marginBottom: 'var(--space-6)' }}>
          Please add items to your cart before proceeding to checkout.
        </p>
        <Link href="/catalog">
          <Button>Return to Catalog</Button>
        </Link>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const shippingCost = formData.shippingMethod === 'EXPRESS' ? 25 : subtotal >= 150 ? 0 : 15;
  const estimatedTax = Number((subtotal * 0.08).toFixed(2));
  const orderTotal = subtotal + shippingCost + estimatedTax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Request Server Checkout Session (API.md Section 4.1)
      const res = await fetch('/api/v1/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: formData.customerEmail,
          customerName: formData.customerName,
          shippingAddress: {
            fullName: formData.customerName,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2 || undefined,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            countryCode: formData.countryCode,
          },
          shippingMethod: formData.shippingMethod,
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to initiate checkout session');
      }

      // If Stripe Checkout URL is provided by backend
      if (data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else if (data.data?.orderNumber) {
        // Direct order created
        clearCart();
        router.push(`/orders/${data.data.orderNumber}?success=true`);
      } else {
        throw new Error('Unexpected checkout response from server');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Secure Checkout</h1>
        <p className={styles.subtitle}>
          256-bit encrypted checkout session powered by Stripe.
        </p>
      </header>

      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <form onSubmit={handleSubmit} className={styles.layout}>
        <div className={styles.formSection}>
          {/* Customer Details */}
          <section className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>1. Contact Information</h2>
            <div className={styles.inputGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Email Address</label>
                <input
                  type="email"
                  name="customerEmail"
                  required
                  placeholder="alexander@domain.com"
                  className={styles.input}
                  value={formData.customerEmail}
                  onChange={handleChange}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="customerName"
                  required
                  placeholder="Alexander Vance"
                  className={styles.input}
                  value={formData.customerName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>2. Shipping Address</h2>
            <div className={styles.inputGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Street Address</label>
                <input
                  type="text"
                  name="addressLine1"
                  required
                  placeholder="100 Grand Street"
                  className={styles.input}
                  value={formData.addressLine1}
                  onChange={handleChange}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Apartment, Suite (Optional)</label>
                <input
                  type="text"
                  name="addressLine2"
                  placeholder="Apt 4B"
                  className={styles.input}
                  value={formData.addressLine2}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>City</label>
                <input
                  type="text"
                  name="city"
                  required
                  placeholder="New York"
                  className={styles.input}
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>State / Province</label>
                <input
                  type="text"
                  name="state"
                  required
                  placeholder="NY"
                  className={styles.input}
                  value={formData.state}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  placeholder="10013"
                  className={styles.input}
                  value={formData.postalCode}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Country</label>
                <select
                  name="countryCode"
                  className={styles.input}
                  value={formData.countryCode}
                  onChange={handleChange}
                >
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>
            </div>
          </section>

          {/* Shipping Method */}
          <section className={styles.sectionBlock}>
            <h2 className={styles.sectionTitle}>3. Shipping Method</h2>
            <label
              className={`${styles.methodOption} ${
                formData.shippingMethod === 'STANDARD' ? styles.methodSelected : ''
              }`}
            >
              <div>
                <input
                  type="radio"
                  name="shippingMethod"
                  value="STANDARD"
                  checked={formData.shippingMethod === 'STANDARD'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <strong>Standard Delivery (3-5 business days)</strong>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {subtotal >= 150 ? 'FREE' : '$15.00'}
              </span>
            </label>

            <label
              className={`${styles.methodOption} ${
                formData.shippingMethod === 'EXPRESS' ? styles.methodSelected : ''
              }`}
            >
              <div>
                <input
                  type="radio"
                  name="shippingMethod"
                  value="EXPRESS"
                  checked={formData.shippingMethod === 'EXPRESS'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                <strong>Priority Express (1-2 business days)</strong>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)' }}>$25.00</span>
            </label>
          </section>
        </div>

        {/* Order Summary Column */}
        <aside className={styles.summaryCard}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          <div className={styles.summaryItems}>
            {items.map((i) => (
              <div key={i.variantId} className={styles.summaryItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemQuantity}>{i.quantity}x</span>
                  <span>{i.title}</span>
                </div>
                <span className={styles.itemPrice}>
                  {formatCurrency((i.salePrice ?? i.price) * i.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.calcRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.calcRow}>
            <span>Estimated Shipping</span>
            <span>{shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}</span>
          </div>
          <div className={styles.calcRow}>
            <span>Estimated Tax (8%)</span>
            <span>{formatCurrency(estimatedTax)}</span>
          </div>
          <div className={styles.calcRowTotal}>
            <span>Total</span>
            <span>{formatCurrency(orderTotal)}</span>
          </div>

          <div style={{ marginTop: 'var(--space-6)' }}>
            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              style={{ width: '100%' }}
            >
              Continue to Payment
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
