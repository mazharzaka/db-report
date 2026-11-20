/**
 * @file sectorsConfig.ts
 * @description Centralized RBAC-Ready Sector Configuration for Dream Park & Zoo.
 * Maps all 6 operational sectors (Branchs.Type 1 through 6) with titles, permissions, and routing.
 */

export interface SectorConfig {
  id: 'caravans' | 'restaurants' | 'rides' | 'vr' | 'gates' | 'parking';
  type: number;
  label: string;
  matrixTitle: string;
  pageTitle: string;
  breadcrumb: string;
  description: string;
  permissionKey: string;
  iconName: 'Caravan' | 'Utensils' | 'FerrisWheel' | 'Gamepad2' | 'Ticket' | 'Car';
  badge: string;
  accentColor: string;
  path: string;
}

export const SECTORS_CONFIG: Record<SectorConfig['id'], SectorConfig> = {
  caravans: {
    id: 'caravans',
    type: 4,
    label: 'الكرفانات',
    matrixTitle: 'مصفوفة الإيرادات - الكرفانات',
    pageTitle: 'إيرادات قطاع الكرفانات والمحلات',
    breadcrumb: 'لوحة تقارير الكرفانات',
    description: 'متابعة وتدقيق إيرادات الأكشاك ومنافذ البيع السريعة والمحلات',
    permissionKey: 'sector:caravans',
    iconName: 'Caravan',
    badge: 'Type 4',
    accentColor: 'orange',
    path: '/reports/caravans',
  },
  restaurants: {
    id: 'restaurants',
    type: 1,
    label: 'المطاعم',
    matrixTitle: 'مصفوفة الإيرادات - المطاعم',
    pageTitle: 'إيرادات قطاع المطاعم',
    breadcrumb: 'لوحة تقارير المطاعم',
    description: 'متابعة وتدقيق إيرادات المطاعم وصالات الطعام الرئيسية',
    permissionKey: 'sector:restaurants',
    iconName: 'Utensils',
    badge: 'Type 1',
    accentColor: 'emerald',
    path: '/reports/restaurants',
  },
  rides: {
    id: 'rides',
    type: 2,
    label: 'الألعاب الكبرى',
    matrixTitle: 'مصفوفة الإيرادات - الألعاب الكبرى',
    pageTitle: 'إيرادات قطاع الألعاب الكبرى',
    breadcrumb: 'لوحة تقارير الألعاب الكبرى',
    description: 'متابعة مبيعات نقاط تشغيل وكاشيرات الألعاب الترفيهية الكبرى',
    permissionKey: 'sector:rides',
    iconName: 'FerrisWheel',
    badge: 'Type 2',
    accentColor: 'blue',
    path: '/reports/rides',
  },
  vr: {
    id: 'vr',
    type: 3,
    label: 'الفيديو جيم والـ VR',
    matrixTitle: 'مصفوفة الإيرادات - الفيديو جيم والـ VR',
    pageTitle: 'إيرادات قطاع الفيديو جيم والـ VR',
    breadcrumb: 'لوحة تقارير الفيديو جيم والـ VR',
    description: 'متابعة وتدقيق إيرادات صالات الألعاب والمحاكيات وقلعة دوبي',
    permissionKey: 'sector:vr',
    iconName: 'Gamepad2',
    badge: 'Type 3',
    accentColor: 'purple',
    path: '/reports/vr',
  },
  gates: {
    id: 'gates',
    type: 5,
    label: 'بوابات التذاكر',
    matrixTitle: 'مصفوفة الإيرادات - بوابات التذاكر',
    pageTitle: 'إيرادات قطاع بوابات التذاكر',
    breadcrumb: 'لوحة تقارير بوابات التذاكر',
    description: 'متابعة وتدقيق مبيعات تذاكر الدخول الفضية وتذاكر البوابات',
    permissionKey: 'sector:gates',
    iconName: 'Ticket',
    badge: 'Type 5',
    accentColor: 'amber',
    path: '/reports/gates',
  },
  parking: {
    id: 'parking',
    type: 6,
    label: 'الأمانات والانتظار',
    matrixTitle: 'مصفوفة الإيرادات - الأمانات والانتظار',
    pageTitle: 'إيرادات قطاع الأمانات والانتظار',
    breadcrumb: 'لوحة تقارير الأمانات والانتظار',
    description: 'متابعة وتدقيق إيرادات بارك السيارات وصناديق الأمانات',
    permissionKey: 'sector:parking',
    iconName: 'Car',
    badge: 'Type 6',
    accentColor: 'cyan',
    path: '/reports/parking',
  },
};

export const SECTORS_LIST: SectorConfig[] = Object.values(SECTORS_CONFIG);

export const DEFAULT_SECTOR: SectorConfig = SECTORS_CONFIG.caravans;

/**
 * استرجاع إعدادات القطاع بواسطة المعرف النصي (id)
 */
export function getSectorById(id: string): SectorConfig | undefined {
  return SECTORS_CONFIG[id as SectorConfig['id']];
}

/**
 * استرجاع إعدادات القطاع بواسطة كود النوع (Branchs.Type)
 */
export function getSectorByType(type: number): SectorConfig | undefined {
  return SECTORS_LIST.find((s) => s.type === type);
}

/**
 * التحقق من صلاحيات المستخدم للوصول لقطاع معين (RBAC Ready)
 * افتراضياً يمنح الصلاحية للمدراء (ADMIN) ولجميع المستخدمين حالياً
 */
export function hasSectorAccess(
  userRole?: string,
  userPermissions?: string[],
  permissionKey?: string
): boolean {
  if (!userRole || userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrator') {
    return true;
  }
  if (!permissionKey) return true;
  if (Array.isArray(userPermissions) && userPermissions.includes(permissionKey)) {
    return true;
  }
  return true; // Default fallback to allow access
}
