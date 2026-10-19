import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage =
    product.images.find((img) => img.isPrimary)?.url ||
    product.images[0]?.url ||
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';

  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.basePrice);

  // Extract unique colors for variant swatches
  const uniqueColors = Array.from(
    new Map(
      product.variants
        .filter((v) => v.color && v.colorHex)
        .map((v) => [v.colorHex, v.colorHex!])
    ).values()
  );

  return (
    <Link href={`/product/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <div className={styles.badgeStack}>
          {hasDiscount && <span className={styles.badgeSale}>Sale</span>}
          {product.isFeatured && <span className={styles.badgeFeatured}>Featured</span>}
        </div>

        <Image
          src={primaryImage}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={styles.image}
        />
      </div>

      <div className={styles.content}>
        {product.category && (
          <span className={styles.category}>{product.category.name}</span>
        )}
        <h3 className={styles.title}>{product.title}</h3>

        <div className={styles.priceRow}>
          {hasDiscount ? (
            <>
              <span className={styles.salePrice}>{formatCurrency(product.salePrice!)}</span>
              <span className={styles.basePriceDiscounted}>
                {formatCurrency(product.basePrice)}
              </span>
            </>
          ) : (
            <span className={styles.basePrice}>{formatCurrency(product.basePrice)}</span>
          )}
        </div>

        {uniqueColors.length > 1 && (
          <div className={styles.colorDots} aria-label={`${uniqueColors.length} color variants`}>
            {uniqueColors.slice(0, 4).map((hex, idx) => (
              <span
                key={idx}
                className={styles.colorDot}
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
