import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              APEX<span>STORE</span>
            </div>
            <p className={styles.tagline}>
              High-performance direct-to-consumer essentials engineered for discerning modern lifestyles.
            </p>
          </div>

          <div className={styles.links}>
            <div className={styles.linkGroup}>
              <h4>Catalog</h4>
              <Link href="/catalog?category=apparel">Apparel</Link>
              <Link href="/catalog?category=tech">Tech & Living</Link>
              <Link href="/catalog?category=accessories">Accessories</Link>
              <Link href="/catalog?featured=true">Featured Drops</Link>
            </div>
            <div className={styles.linkGroup}>
              <h4>Customer Support</h4>
              <Link href="/orders">Track Order</Link>
              <Link href="/faq">Shipping & Returns</Link>
              <Link href="/privacy">Privacy & Terms</Link>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} ApexStore Inc. All rights reserved.</p>
          <p className={styles.securityBadge}>256-bit Encrypted Checkout • Stripe Certified</p>
        </div>
      </div>
    </footer>
  );
}
