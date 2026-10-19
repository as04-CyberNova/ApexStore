import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductView } from './ProductView';
import styles from './product.module.css';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = params;

  const productRaw = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      variants: { where: { isActive: true } },
    },
  });

  if (!productRaw || !productRaw.isActive) {
    notFound();
  }

  // Convert Decimals to numbers for client component serialization
  const product = {
    ...productRaw,
    basePrice: Number(productRaw.basePrice),
    salePrice: productRaw.salePrice ? Number(productRaw.salePrice) : null,
    variants: productRaw.variants.map((v) => ({
      ...v,
      priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
    })),
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/catalog">Catalog</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/catalog?category=${product.category.slug}`}>
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span>{product.title}</span>
      </div>

      <ProductView product={product as any} />
    </div>
  );
}
