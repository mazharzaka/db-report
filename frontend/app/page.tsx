'use client';

import React from 'react';
import { SectorDashboard } from '@/components/reports/SectorDashboard';
import { SECTORS_CONFIG } from '@/config/sectorsConfig';

export default function HomePage() {
  return <SectorDashboard sector={SECTORS_CONFIG.caravans} />;
}
