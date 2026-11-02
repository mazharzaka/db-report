'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  DollarSign,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
  Download,
  Search,
  ArrowUpDown,
  LayoutDashboard,
  Compass,
  Ticket,
  Store,
  Settings,
  Bell,
  ChevronDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { ThemeToggle } from './ThemeToggle';

// ==========================================
// MOCK DATA & TIME-SERIES GENERATORS
// ==========================================

const sparklineVisitors = [
  { v: 11200 }, { v: 12400 }, { v: 11900 }, { v: 13500 }, { v: 12800 }, { v: 14100 }, { v: 14820 }
];

const sparklineRevenue = [
  { v: 1150000 }, { v: 1280000 }, { v: 1210000 }, { v: 1390000 }, { v: 1340000 }, { v: 1420000 }, { v: 1485200 }
];

const sparklineWaitTime = [
  { v: 24 }, { v: 22 }, { v: 26 }, { v: 21 }, { v: 19 }, { v: 20 }, { v: 18 }
];

const sparklineAlerts = [
  { v: 1 }, { v: 2 }, { v: 1 }, { v: 4 }, { v: 2 }, { v: 2 }, { v: 3 }
];

// 30 Days Visitor Attendance Data
const visitorHistoryData = [
  { date: '1 أكت', visitors: 9400 },
  { date: '2 أكت', visitors: 9800 },
  { date: '3 أكت', visitors: 11200 },
  { date: '4 أكت', visitors: 14500 },
  { date: '5 أكت', visitors: 13800 },
  { date: '6 أكت', visitors: 10200 },
  { date: '7 أكت', visitors: 9600 },
  { date: '8 أكت', visitors: 10100 },
  { date: '9 أكت', visitors: 10500 },
  { date: '10 أكت', visitors: 12100 },
  { date: '11 أكت', visitors: 15200 },
  { date: '12 أكت', visitors: 14800 },
  { date: '13 أكت', visitors: 10800 },
  { date: '14 أكت', visitors: 9900 },
  { date: '15 أكت', visitors: 10400 },
  { date: '16 أكت', visitors: 11300 },
  { date: '17 أكت', visitors: 12800 },
  { date: '18 أكت', visitors: 16100 },
  { date: '19 أكت', visitors: 15400 },
  { date: '20 أكت', visitors: 11100 },
  { date: '21 أكت', visitors: 10600 },
  { date: '22 أكت', visitors: 11400 },
  { date: '23 أكت', visitors: 12300 },
  { date: '24 أكت', visitors: 13900 },
  { date: '25 أكت', visitors: 16800 },
  { date: '26 أكت', visitors: 15900 },
  { date: '27 أكت', visitors: 14820 },
];

// Ticket Type Split (Max 4 Segments)
const ticketSplitData = [
  { name: 'تذكرة شاملة (All-Access)', value: 5840, share: '39.4%' },
  { name: 'تذكرة عائلية (Family Pass)', value: 4120, share: '27.8%' },
  { name: 'تذكرة قياسية (Standard)', value: 3260, share: '22.0%' },
  { name: 'تذكرة مسائية (Evening)', value: 1600, share: '10.8%' },
];

// Revenue by Attraction (Horizontal Bar, Sorted Descending)
const attractionRevenueData = [
  { name: 'قطار الموت (Roller Coaster)', revenue: 384000, isTop: true },
  { name: 'الشلالات المائية (Water Falls)', revenue: 295000, isTop: false },
  { name: 'دولاب الهواء العملاق (Ferris Wheel)', revenue: 248000, isTop: false },
  { name: 'حديقة الحيوان المفتوحة (Safari)', revenue: 215000, isTop: false },
  { name: 'بيت الرعب (Horror Mansion)', revenue: 182000, isTop: false },
  { name: 'سيارات التصادم (Bumper Cars)', revenue: 142000, isTop: false },
];

// Attendance by Hour of Day (Subtle Column Chart)
const hourlyAttendanceData = [
  { hour: '10:00', count: 820 },
  { hour: '11:00', count: 1450 },
  { hour: '12:00', count: 2100 },
  { hour: '13:00', count: 2750 },
  { hour: '14:00', count: 3400 },
  { hour: '15:00', count: 3900 },
  { hour: '16:00', count: 4250 },
  { hour: '17:00', count: 4600 },
  { hour: '18:00', count: 4820 },
  { hour: '19:00', count: 4300 },
  { hour: '20:00', count: 3600 },
  { hour: '21:00', count: 2400 },
  { hour: '22:00', count: 1100 },
];

// Recent Transactions Table Data
interface Transaction {
  id: string;
  orderNumber: string;
  customer: string;
  channel: string;
  time: string;
  amount: number;
  status: 'completed' | 'processing' | 'refunded';
}

const initialTransactions: Transaction[] = [
  { id: '1', orderNumber: 'DP-89241', customer: 'أحمد محمود مصطفى', channel: 'البوابة الرئيسية #1', time: '14:38', amount: 1450.00, status: 'completed' },
  { id: '2', orderNumber: 'DP-89240', customer: 'مجموعة النور المدرسية', channel: 'حجز مسبق (شركات)', time: '14:32', amount: 8600.00, status: 'completed' },
  { id: '3', orderNumber: 'DP-89239', customer: 'سارة خالد النجار', channel: 'تطبيق دريم بارك', time: '14:28', amount: 950.00, status: 'completed' },
  { id: '4', orderNumber: 'DP-89238', customer: 'كرفان البافاري #4', channel: 'منفذ إيراد كرفان', time: '14:21', amount: 480.00, status: 'completed' },
  { id: '5', orderNumber: 'DP-89237', customer: 'عمر فاروق الشناوي', channel: 'بوابة الألعاب المائية', time: '14:15', amount: 620.00, status: 'processing' },
  { id: '6', orderNumber: 'DP-89236', customer: 'ياسر كمال الألفي', channel: 'نقطة بيع شباك #3', time: '14:02', amount: 350.00, status: 'refunded' },
  { id: '7', orderNumber: 'DP-89235', customer: 'منى عبد الرحمن حسن', channel: 'البوابة الرئيسية #2', time: '13:54', amount: 1200.00, status: 'completed' },
];

export function OperationsDashboard() {
  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState('اليوم — 27 أكتوبر 2026');
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [sortField, setSortField] = useState<keyof Transaction>('time');
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    let result = transactions.filter((t) =>
      t.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customer.includes(searchQuery) ||
      t.channel.includes(searchQuery)
    );

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === bVal) return 0;
      const comp = aVal > bVal ? 1 : -1;
      return sortAsc ? comp : -comp;
    });

    return result;
  }, [transactions, searchQuery, sortField, sortAsc]);

  if (!mounted) {
    return null; // Avoid hydration mismatch on initial render
  }

  return (
    <div className="flex min-h-screen bg-background font-sans antialiased text-foreground" dir="rtl">
      {/* ============================================================ */}
      {/* FIXED SIDEBAR NAVIGATION (QUIET EDITORIAL) */}
      {/* ============================================================ */}
      <aside className="w-64 border-l border-border bg-card flex flex-col fixed inset-y-0 right-0 z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-border/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-primary text-primary-foreground font-black text-sm flex items-center justify-center tracking-tight">
              DP
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-foreground block">
                دريم بارك & زوو
              </span>
              <span className="text-[11px] text-muted-foreground block tracking-normal">
                لوحة العمليات المركزية
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            المؤشرات والعمليات
          </div>
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium bg-accent text-accent-foreground transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-primary" />
            <span>نظرة عامة على العمليات</span>
          </a>
          <a
            href="/reports/caravans/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>إيرادات الكرفانات (Type = 4)</span>
          </a>
          <a
            href="#attractions"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>الألعاب ومناطق الجذب</span>
          </a>
          <a
            href="#tickets"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Ticket className="w-4 h-4" />
            <span>حركة التذاكر والبوابات</span>
          </a>

          <div className="pt-4 px-3 pb-2 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
            إدارة المنظومة
          </div>
          <a
            href="#alerts"
            className="flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4" />
              <span>التنبيهات التشغيلية</span>
            </div>
            <span className="tabular-nums text-[10px] bg-destructive/15 text-destructive px-1.5 py-0.5 rounded font-bold">
              3
            </span>
          </a>
          <a
            href="#settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات النظام</span>
          </a>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-border/80 text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>بيئة الشبكة الداخلية (LAN)</span>
            <span className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <div className="mt-1 text-[10px] opacity-75">خادم SQL: DP-DATABASESRV2</div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div className="flex-1 mr-64 flex flex-col min-h-screen">
        {/* Editorial Header */}
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur-xs sticky top-0 z-20 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">
              التقرير التشغيلي والمالي المباشر
            </h1>
            <p className="text-xs text-muted-foreground">
              متابعة الإقبال، الإيرادات، وأوقات الانتظار اللحظية
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Picker (Editorial Button) */}
            <div className="flex items-center gap-2 border border-border bg-background px-3 py-1.5 rounded-md text-xs font-medium text-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="tabular-nums">{dateRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </header>

        {/* Body Content */}
        <main className="p-8 space-y-6 flex-1 max-w-[1600px] w-full">
          {/* ============================================================ */}
          {/* ROW 1: 4 KPI CARDS WITH SPARKLINES (RECHARTS) */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1: Visitors Today */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  إجمالي زوار اليوم
                </CardDescription>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                    14,820
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-medium text-primary tabular-nums">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+12.4%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-9 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineVisitors}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                  مقارنة بنفس التوقيت الأسبوع الماضي (13,180)
                </div>
              </CardContent>
            </Card>

            {/* KPI 2: Revenue Today */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  إيراد اليوم المحقق
                </CardDescription>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                    1,485,200 <span className="text-xs font-normal text-muted-foreground">ج.م</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-medium text-primary tabular-nums">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>+8.1%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-9 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineRevenue}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                  متوسط الفاتورة: 100.21 ج.م / زائر
                </div>
              </CardContent>
            </Card>

            {/* KPI 3: Average Wait Time */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  متوسط وقت انتظار الألعاب
                </CardDescription>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                    18 <span className="text-xs font-normal text-muted-foreground">دقيقة</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-medium text-primary tabular-nums">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>-4.2%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-9 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineWaitTime}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 tabular-nums">
                  الحد الأقصى الحالي: 34 دقيقة (قطار الموت)
                </div>
              </CardContent>
            </Card>

            {/* KPI 4: Active Alerts */}
            <Card className="flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-medium text-muted-foreground">
                  التنبيهات التشغيلية النشطة
                </CardDescription>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                    3 <span className="text-xs font-normal text-muted-foreground">تنبيهات</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-xs font-medium text-destructive tabular-nums">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>تحذير فني</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-9 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineAlerts}>
                      <Line
                        type="stepAfter"
                        dataKey="v"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  صيانة دورية: مضخة الشلال رقم 2
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================ */}
          {/* ROW 2: MAIN AREA CHART (30 DAYS) + DONUT TICKET SPLIT */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Area Chart: Visitors per Day */}
            <Card className="lg:col-span-8 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>تدفق الزوار اليومي (آخر 30 يوماً)</CardTitle>
                    <CardDescription className="mt-1">
                      ما هو اتجاه الإقبال الإجمالي وتذبذب عطلات نهاية الأسبوع؟
                    </CardDescription>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums border border-border px-2.5 py-1 rounded-sm bg-muted/30">
                    متوسط: 12,410 زائر/يوم
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visitorHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))',
                          boxShadow: 'none'
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} زائر`, 'العدد']}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="none"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Donut Chart: Ticket Type Split (Max 4 Segments) */}
            <Card className="lg:col-span-4 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle>توزيع مبيعات فئات التذاكر</CardTitle>
                <CardDescription className="mt-1">
                  ما هي الحصة النسبية لكل نوع تذكرة من إجمالي مبيعات اليوم؟
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 flex flex-col justify-center flex-1">
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketSplitData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        <Cell fill="hsl(var(--chart-4))" />
                        <Cell fill="hsl(var(--chart-3))" />
                        <Cell fill="hsl(var(--chart-2))" />
                        <Cell fill="hsl(var(--chart-1))" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))',
                          boxShadow: 'none'
                        }}
                        formatter={(v: any) => [`${Number(v).toLocaleString()} تذكرة`, 'المبيعات']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Explicit Legend beside/underneath (Not on slices) */}
                <div className="space-y-2 mt-4 pt-3 border-t border-border/80">
                  {ticketSplitData.map((item, idx) => {
                    const tintVar = `var(--chart-${4 - idx})`;
                    return (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-xs flex-shrink-0"
                            style={{ backgroundColor: `hsl(${tintVar})` }}
                          />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <div className="tabular-nums font-medium text-foreground">
                          {item.value.toLocaleString()} <span className="text-muted-foreground text-[10px]">({item.share})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================ */}
          {/* ROW 3: HORIZONTAL BAR (REVENUE BY ATTRACTION) + COLUMN (HOURLY ATTENDANCE) */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Horizontal Bar: Revenue by Attraction (Top Bar Highlighted) */}
            <Card className="lg:col-span-6 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle>إيرادات الألعاب ومناطق الجذب</CardTitle>
                <CardDescription className="mt-1">
                  ما هي مناطق الجذب الأعلى مساهمة في الدخل التشغيلي اليوم؟
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={attractionRevenueData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={150}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))',
                          boxShadow: 'none'
                        }}
                        formatter={(val: any) => [`${Number(val).toLocaleString()} ج.م`, 'الإيراد']}
                      />
                      <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                        {attractionRevenueData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isTop ? 'hsl(var(--primary))' : 'hsl(var(--chart-1))'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Column Chart: Attendance by Hour of Day */}
            <Card className="lg:col-span-6 flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle>كثافة الحضور بحسب ساعات اليوم</CardTitle>
                <CardDescription className="mt-1">
                  متى تبلغ الكثافة التشغيلية ذروتها على مدار ساعات العمل (10:00 - 22:00)؟
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={hourlyAttendanceData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="hour"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '12px',
                          color: 'hsl(var(--foreground))',
                          boxShadow: 'none'
                        }}
                        formatter={(v: any) => [`${Number(v).toLocaleString()} زائر`, 'حضور الساعة']}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--chart-3))"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ============================================================ */}
          {/* ROW 4: RECENT TRANSACTIONS TABLE (SHADCN TABLE + BADGES) */}
          {/* ============================================================ */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>سجل العمليات والتعاملات اللحظية</CardTitle>
                  <CardDescription className="mt-1">
                    أحدث عمليات حجز التذاكر ومبيعات المنافذ المباشرة
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث برقم العملية أو العميل..."
                    className="w-full pr-9 pl-3 py-1.5 text-xs bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28 cursor-pointer" onClick={() => handleSort('orderNumber')}>
                      <div className="flex items-center gap-1.5">
                        <span>رقم المعاملة</span>
                        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('customer')}>
                      <div className="flex items-center gap-1.5">
                        <span>العميل / الجهة</span>
                        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead>المنفذ / البوابة</TableHead>
                    <TableHead className="w-24 cursor-pointer" onClick={() => handleSort('time')}>
                      <div className="flex items-center gap-1.5">
                        <span>الوقت</span>
                        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="w-32 text-end cursor-pointer" onClick={() => handleSort('amount')}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>القيمة</span>
                        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="w-28 text-center">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                        لا توجد عمليات مطابقة لمعايير البحث
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                          {tx.orderNumber}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-foreground">
                          {tx.customer}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {tx.channel}
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                          {tx.time}
                        </TableCell>
                        <TableCell className="text-end font-mono text-xs tabular-nums font-semibold text-foreground">
                          {tx.amount.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.status === 'completed' && (
                            <Badge variant="accent">ناجح ومكتمل</Badge>
                          )}
                          {tx.status === 'processing' && (
                            <Badge variant="secondary">قيد المراجعة</Badge>
                          )}
                          {tx.status === 'refunded' && (
                            <Badge variant="destructive">مسترد</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

