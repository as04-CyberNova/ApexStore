'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/useCartStore';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import styles from './CartDrawer.module.css';

const FREE_SHIPPING_THRESHOLD = 150;

export function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      <div className={styles.overlay} onClick={closeCart} aria-hidden="true" />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Cart"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <span>Cart</span>
            <span className={styles.itemCount}>({itemCount})</span>
          </div>
          <button
            onClick={closeCart}
            className={styles.closeBtn}
            aria-label="Close cart"
          >
            &times;
          </button>
        </div>

        {/* Free Shipping Meter */}
        <div className={styles.shippingMeter}>
          <div className={styles.meterText}>
            <span>
              {amountToFreeShipping > 0 ? (
                <>
                  Add <strong>{formatCurrency(amountToFreeShipping)}</strong> for complimentary express shipping
                </>
              ) : (
                <strong style={{ color: 'var(--color-success)' }}>
                  ✓ You have unlocked Complimentary Express Shipping!
                </strong>
              )}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(shippingProgress)}%</span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={`${styles.progressBarFill} ${
                amountToFreeShipping === 0 ? styles.freeUnlocked : ''
              }`}
              style={{ width: `${shippingProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Item List */}
        {items.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛍</div>
            <h3>Your cart is empty</h3>
            <p>Discover minimal essentials crafted with architectural precision.</p>
            <Link href="/catalog" onClick={closeCart}>
              <Button variant="outline" size="sm">
                Explore Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.variantId} className={styles.cartItem}>
                <div className={styles.itemImageWrapper}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={80}
                      height={96}
                      className={styles.itemImage}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} />
                  )}
                </div>

                <div className={styles.itemDetails}>
                  <div className={styles.itemTop}>
                    <div>
                      <h4 className={styles.itemTitle}>{item.title}</h4>
                      <p className={styles.itemMeta}>
                        {[item.color, item.size].filter(Boolean).join(' / ') || 'Standard Edition'}
                      </p>
                    </div>
                    <span className={styles.itemPrice}>
                      {formatCurrency((item.salePrice ?? item.price) * item.quantity)}
                    </span>
                  </div>

                  <div className={styles.itemActions}>
                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.variantId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Subtotal & Checkout */}
        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.subtotalRow}>
              <span className={styles.subtotalLabel}>Subtotal</span>
              <span className={styles.subtotalValue}>{formatCurrency(subtotal)}</span>
            </div>

            <Link href="/checkout" onClick={closeCart}>
              <Button size="lg" style={{ width: '100%' }}>
                Proceed to Checkout
              </Button>
            </Link>

            <p className={styles.checkoutNotice}>
              Taxes and final shipping calculated at checkout.
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
