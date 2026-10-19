import Link from 'next/link';
import { Button } from '@/components/common/Button';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* Hero Showcase */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Autumn / Winter Collection</span>
          <h1 className={styles.title}>
            Architectural Precision.
            <br />
            Everyday Elegance.
          </h1>
          <p className={styles.subtitle}>
            Engineered materials meet minimalist aesthetics. Discover refined essentials designed to endure.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/catalog">
              <Button size="lg">Explore Collection</Button>
            </Link>
            <Link href="/catalog?featured=true">
              <Button variant="outline" size="lg">
                View Best Sellers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Value Props Bar */}
      <section className={styles.values}>
        <div className={styles.valueCard}>
          <div className={styles.valueIcon}>✦</div>
          <div>
            <h3>Free Express Delivery</h3>
            <p>On all domestic orders exceeding $150</p>
          </div>
        </div>
        <div className={styles.valueCard}>
          <div className={styles.valueIcon}>◈</div>
          <div>
            <h3>30-Day Evaluation</h3>
            <p>Complimentary returns & exchanges</p>
          </div>
        </div>
        <div className={styles.valueCard}>
          <div className={styles.valueIcon}>❖</div>
          <div>
            <h3>Encrypted Checkout</h3>
            <p>Tokenized Stripe & Apple Pay security</p>
          </div>
        </div>
      </section>
    </div>
  );
}
