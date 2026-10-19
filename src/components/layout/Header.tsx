'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import styles from './Header.module.css';

export function Header() {
  const [mounted, setMounted] = useState(false);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const openCart = useCartStore((state) => state.openCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = mounted ? getItemCount() : 0;

  return (
    <header className={styles.header}>
      {/* Announcement Bar */}
      <div className={styles.announcement}>
        <span>Complimentary express shipping on all orders over $150</span>
      </div>

      {/* Main Navbar */}
      <div className={styles.navbar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            APEX<span>STORE</span>
          </Link>

          <nav className={styles.nav} aria-label="Main Navigation">
            <Link href="/catalog" className={styles.navLink}>
              Catalog
            </Link>
            <Link href="/catalog?category=apparel" className={styles.navLink}>
              Apparel
            </Link>
            <Link href="/catalog?category=tech" className={styles.navLink}>
              Tech & Living
            </Link>
            <Link href="/catalog?category=accessories" className={styles.navLink}>
              Accessories
            </Link>
          </nav>

          <div className={styles.actions}>
            <Link href="/catalog" className={styles.actionBtn} aria-label="Search Catalog">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </Link>
            <button
              onClick={openCart}
              className={styles.cartButton}
              aria-label={`Shopping Cart with ${itemCount} items`}
            >
              <span>Cart</span>
              <span className={styles.cartBadge}>{itemCount}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
