'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Product, ProductVariant } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/common/Button';
import styles from './product.module.css';

interface ProductViewProps {
  product: Product;
}

export function ProductView({ product }: ProductViewProps) {
  const images = product.images.length > 0 ? product.images : [
    {
      id: 'default',
      productId: product.id,
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
      altText: product.title,
      isPrimary: true,
      sortOrder: 0,
    }
  ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Available variants
  const variants = product.variants;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    variants[0] || {
      id: 'default',
      productId: product.id,
      sku: 'APEX-DEFAULT',
      stockCount: 10,
      isActive: true,
    }
  );

  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  // Price calculations
  const effectiveBasePrice = selectedVariant.priceOverride ?? product.basePrice;
  const effectiveSalePrice = product.salePrice;
  const hasDiscount = Boolean(effectiveSalePrice && effectiveSalePrice < effectiveBasePrice);
  const currentPrice = effectiveSalePrice ?? effectiveBasePrice;

  // Colors & Sizes
  const uniqueColors = Array.from(
    new Map(variants.filter((v) => v.color).map((v) => [v.color, v])).values()
  );
  const uniqueSizes = Array.from(
    new Map(variants.filter((v) => v.size).map((v) => [v.size, v])).values()
  );

  const handleAddToCart = () => {
    setIsAdding(true);
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      title: product.title,
      sku: selectedVariant.sku,
      price: effectiveBasePrice,
      salePrice: effectiveSalePrice,
      image: images[activeImageIndex]?.url || images[0].url,
      size: selectedVariant.size,
      color: selectedVariant.color,
      quantity: 1,
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 400);
  };

  return (
    <div className={styles.productLayout}>
      {/* Visual Media Gallery */}
      <section className={styles.gallerySection}>
        <div className={styles.mainImageWrapper}>
          <Image
            src={images[activeImageIndex]?.url || images[0].url}
            alt={images[activeImageIndex]?.altText || product.title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 55vw"
            className={styles.mainImage}
          />
        </div>

        {images.length > 1 && (
          <div className={styles.thumbStrip}>
            {images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImageIndex(idx)}
                className={`${styles.thumbBtn} ${
                  activeImageIndex === idx ? styles.activeThumb : ''
                }`}
                aria-label={`View photo ${idx + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.altText}
                  fill
                  sizes="80px"
                  style={{ objectFit: 'cover' }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Product Details & Action Panel */}
      <section className={styles.infoSection}>
        {product.category && (
          <span className={styles.categoryTag}>{product.category.name}</span>
        )}
        <h1 className={styles.title}>{product.title}</h1>

        <div className={styles.priceWrapper}>
          {hasDiscount ? (
            <>
              <span className={styles.salePrice}>{formatCurrency(effectiveSalePrice!)}</span>
              <span className={styles.originalPrice}>
                {formatCurrency(effectiveBasePrice)}
              </span>
            </>
          ) : (
            <span className={styles.price}>{formatCurrency(effectiveBasePrice)}</span>
          )}
        </div>

        {/* Low Stock Indicator */}
        {selectedVariant.stockCount > 0 && selectedVariant.stockCount <= 5 && (
          <div className={styles.stockScarcity}>
            <span>⚠ Low Inventory: Only {selectedVariant.stockCount} left in stock</span>
          </div>
        )}

        <div className={styles.divider} />

        {/* Color Selector */}
        {uniqueColors.length > 0 && (
          <div className={styles.pickerGroup}>
            <div className={styles.pickerHeader}>
              <span className={styles.pickerLabel}>Color</span>
              <span className={styles.pickerValue}>{selectedVariant.color || 'Standard'}</span>
            </div>
            <div className={styles.swatchGrid}>
              {uniqueColors.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`${styles.colorSwatch} ${
                    selectedVariant.color === v.color ? styles.activeColorSwatch : ''
                  }`}
                  style={{ backgroundColor: v.colorHex || '#18181b' }}
                  title={v.color || ''}
                  aria-label={`Select color ${v.color}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size Selector */}
        {uniqueSizes.length > 0 && (
          <div className={styles.pickerGroup}>
            <div className={styles.pickerHeader}>
              <span className={styles.pickerLabel}>Size</span>
              <span className={styles.pickerValue}>{selectedVariant.size || 'Regular'}</span>
            </div>
            <div className={styles.swatchGrid}>
              {uniqueSizes.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`${styles.sizePill} ${
                    selectedVariant.size === v.size ? styles.activeSizePill : ''
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add to Cart CTA */}
        <div style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
          <Button
            size="lg"
            onClick={handleAddToCart}
            isLoading={isAdding}
            disabled={selectedVariant.stockCount <= 0}
            style={{ width: '100%' }}
          >
            {selectedVariant.stockCount > 0
              ? `Add to Cart — ${formatCurrency(currentPrice)}`
              : 'Out of Stock'}
          </Button>
        </div>

        {/* Description & Value Props */}
        <p className={styles.description}>{product.description}</p>

        <ul className={styles.featuresList}>
          <li>Ethically sourced precision craftsmanship</li>
          <li>Complimentary express shipping on orders over $150</li>
          <li>Hassle-free 30-day evaluation and return window</li>
        </ul>
      </section>
    </div>
  );
}
