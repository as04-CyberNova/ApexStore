import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/catalog/ProductCard';
import styles from './catalog.module.css';

export const dynamic = 'force-dynamic';

interface CatalogPageProps {
  searchParams: {
    category?: string;
    featured?: string;
    sort?: string;
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const { category, featured, sort } = searchParams;

  // Build Prisma where filter
  const where: any = { isActive: true };

  if (category) {
    where.category = { slug: category };
  }

  if (featured === 'true') {
    where.isFeatured = true;
  }

  // Sorting
  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') {
    orderBy = { basePrice: 'asc' };
  } else if (sort === 'price_desc') {
    orderBy = { basePrice: 'desc' };
  } else if (sort === 'title_asc') {
    orderBy = { title: 'asc' };
  }

  // Parallel fetch products and active categories
  const [productsRaw, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    }),
  ]);

  // Convert Decimal to number for Next.js serialization
  const products = productsRaw.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    variants: p.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
  }));

  const activeCategory = categories.find((c) => c.slug === category);
  const pageTitle = activeCategory
    ? activeCategory.name
    : featured === 'true'
    ? 'Featured Drops'
    : 'All Essentials';

  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Catalog</span>
          {activeCategory && (
            <>
              <span>/</span>
              <span>{activeCategory.name}</span>
            </>
          )}
        </div>
        <h1 className={styles.title}>{pageTitle}</h1>
        <p className={styles.subtitle}>
          {activeCategory?.description ||
            'Engineered essentials tailored with architectural silhouettes and uncompromising material standards.'}
        </p>
      </header>

      {/* Filter Tabs */}
      <div className={styles.controlsBar}>
        <div className={styles.filterTabs}>
          <Link
            href="/catalog"
            className={`${styles.tab} ${!category && !featured ? styles.activeTab : ''}`}
          >
            All Items
          </Link>
          <Link
            href="/catalog?featured=true"
            className={`${styles.tab} ${featured === 'true' ? styles.activeTab : ''}`}
          >
            Featured
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.slug}`}
              className={`${styles.tab} ${category === cat.slug ? styles.activeTab : ''}`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <span className={styles.productCount}>
          {products.length} {products.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No products found</h2>
          <p className={styles.emptySubtitle}>
            We could not find any products matching your current filter selection.
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </div>
  );
}
