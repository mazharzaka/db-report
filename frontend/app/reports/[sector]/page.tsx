import React from 'react';
import { notFound } from 'next/navigation';
import { getSectorById, SECTORS_LIST } from '@/config/sectorsConfig';
import { SectorDashboard } from '@/components/reports/SectorDashboard';
import type { Metadata } from 'next';

export function generateStaticParams() {
  return SECTORS_LIST.map((s) => ({
    sector: s.id,
  }));
}

export function generateMetadata({ params }: { params: { sector: string } }): Metadata {
  const sector = getSectorById(params.sector);
  if (!sector) {
    return {
      title: 'قطاع غير معروف — منظومة دريم بارك',
    };
  }
  return {
    title: `${sector.pageTitle} — دريم بارك المركزية`,
    description: sector.description,
  };
}

export default function SectorReportPage({ params }: { params: { sector: string } }) {
  const sector = getSectorById(params.sector);
  if (!sector) {
    notFound();
  }

  return <SectorDashboard sector={sector} />;
}
