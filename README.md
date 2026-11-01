# 🎪 Dream Park Caravan Revenues 2026 — Standalone Dashboard & Windows Service

تطبيق ويب تنفيذي خفيف ومستقل تماماً مخصص لعرض ومتابعة **إيرادات ومبيعات الكرفانات (Caravans)** في دريم بارك لسنة **2026**، مفصول كلياً عن محرك المحادثة الرئيسي ويمكن تشغيله وتثبيته كخدمة ويندوز تعمل 24/7 على سيرفر الشركة.

---

## 📁 هيكل المشروع المستقل (Isolated Project Structure)

```text
caravan-revenues-app/
├── package.json              # تبعيات الحد الأدنى (express, mssql, cors, dotenv, node-windows)
├── server.js                 # خادم Express يربط مباشرة بقاعدة بيانات SQL Server
├── .env                      # إعدادات الاتصال والمنفذ (Port 3005)
├── .env.example              # نموذج متغيرات البيئة
├── install_service.js        # سكريبت تثبيت التطبيق كخدمة ويندوز 24/7 (Windows Service)
├── uninstall_service.js      # سكريبت إزالة خدمة الويندوز
├── README.md                 # دليل التثبيت والتشغيل
└── public/
    └── index.html            # لوحة تحكم تفاعلية باللغة العربية (Dark Theme, Tailwind, Chart.js, SheetJS)
```

---

## ⚡ الميزات والخصائص الرئيسية

1. **مستقل بالكامل (Decoupled & Isolated):** لا يعتمد على أي مجلد أو مكتبة خارجية خارج هذا المجلد.
2. **اتصال مباشر وقوي بقاعدة البيانات (Dual SQL Drivers):**
   - يدعم بروتوكول `Tedious` القياسي ومنفذ `1433`.
   - يدعم بروتوكول `msnodesqlv8` المحلي عبر Named Pipes / Shared Memory كخطة احتياطية سريعة.
3. **أداء وفهرسة فائقة:**
   - يستعلم عن كود الكرفانات `Type = 4` من جدول الفروع `[Branchs]` ويربطه بجدول المبيعات `[Rpt_Pos_max]`.
   - استعلام مُمَعلَم بالكامل (Parameterized Query) سريع التنفيذ (20 - 90 مللي ثانية).
4. **لوحة مؤشرات تنفيذية فاخرة (Executive Dashboard):**
   - تصميم ليلي عصري (Dark Mode) مع دعم كامل للغة العربية والاتجاه من اليمين لليسار (RTL).
   - 4 بطاقات مؤشرات رئيسية (إجمالي المبيعات، التدفق النقدي، مبيعات الفيزا والآجل، إجمالي الزائرين ومتوسط التذكرة).
   - رسم بياني أفقي متدرج للترتيب والمقارنة التنافسية بين الكرفانات.
   - رسم بياني دائري (Donut Chart) يوضح نسب وسائل الدفع (كاش / فيزا / آجل C/L).
   - جدول محاسبي تفصيلي يظهر الأرقام بدقة، نسبة المساهمة السوقية لكل كرفان، وصف إجمالي نهائي.
   - تصفية تفاعلية حسب الفترة الزمنية (السنة كاملة 2026، الربع الأول Q1، الربع الثاني Q2، الربع الثالث Q3، الربع الرابع Q4).
   - فرز فوري وديناميكي حسب المبيعات أو النقدية أو الزوار، وبحث فوري بالاسم.
   - تصدير مباشر إلى ملف **Excel (.xlsx)** بأسماء أعمدة عربية وتنسيقات محاسبية عبر مكتبة SheetJS.
   - دعم التجهيز للطباعة الفورية (@media print) بنسخة نظيفة لتقارير الإدارة العليا.
5. **تشغيل صامت كخدمة ويندوز (Windows Service 24/7):**
   - يتم تثبيت التطبيق كخدمة في النظام تعمل تلقائياً مع بدء تشغيل السيرفر دون الحاجة لتسجيل دخول المستخدم أو فتح شاشة Terminal.

---

## 🚀 متطلبات التشغيل (Prerequisites)

- **Node.js**: الإصدار 18 أو أحدث مثبت على الجهاز/السيرفر.
- **SQL Server**: قاعدة بيانات دريم بارك متاحة وصلاحيات قراءة على الجداول `[Branchs]` و `[Rpt_Pos_max]`.

---

## 🛠️ التثبيت والتشغيل المحلي (Quick Start)

### 1. تثبيت التبعيات:
افتح موجه الأوامر (PowerShell أو Terminal) داخل مجلد `caravan-revenues-app`:
```bash
npm install
```

### 2. ضبط ملف الإعدادات (`.env`):
تحقق من بيانات الاتصال بقاعدة البيانات في ملف `.env`:
```ini
PORT=3005
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_NAME=dbDream_Park_Resturant
DB_USER=app_readonly_user
DB_PASSWORD=Readonly@2026
```

### 3. تشغيل التطبيق في وضع التطوير:
```bash
npm start
```
أو مع المراقبة التلقائية للتعديلات:
```bash
npm run dev
```

### 4. فتح لوحة المؤشرات في المتصفح:
- **لوحة التحكم:** [http://localhost:3005](http://localhost:3005)
- **واجهة البيانات البرمجية:** [http://localhost:3005/api/caravans-2026](http://localhost:3005/api/caravans-2026)
- **فحص صحة الاتصال والخادم:** [http://localhost:3005/api/health](http://localhost:3005/api/health)

---

## 🛡️ تثبيت التطبيق كخدمة ويندوز دائمة (Windows Service Installation)

لتشغيل التطبيق بشكل صامت 24/7 على سيرفر الشركة المخصص:

### 1. فتح PowerShell كمسؤول (Run as Administrator):
انقر بزر الماوس الأيمن على PowerShell واختر **"Run as Administrator"**.

### 2. الانتقال إلى مجلد التطبيق وتثبيت الخدمة:
```powershell
cd "d:\projects\Smart Tech Article Summarizer\caravan-revenues-app"
npm run service:install
```
- سيتم تسجيل الخدمة في خدمات ويندوز باسم: `Dream Park Caravans 2026`.
- ستبدأ الخدمة بالعمل فوراً في الخلفية على المنفذ `3005`.
- يمكن مراقبة حالة الخدمة من خلال أداة ويندوز `services.msc`.

### 3. إزالة خدمة الويندوز عند الحاجة:
من نفس موجه أوامر المسؤول:
```powershell
npm run service:uninstall
```

---

## 📡 واجهات الـ API المتاحة

### `GET /api/caravans-2026`
يقبل المعاملات الاختيارية عبر Query String:
- `startDate`: تاريخ البداية (الافتراضي: `2026-01-01`)
- `endDate`: تاريخ النهاية (الافتراضي: `2027-01-01`)

**نموذج الاستجابة:**
```json
{
  "status": "success",
  "meta": {
    "report": "Dream Park Caravan Revenues 2026",
    "year": 2026,
    "period": { "startDate": "2026-01-01", "endDate": "2027-01-01" },
    "executionTimeMs": 28,
    "driverUsed": "tedious",
    "caravansCount": 17
  },
  "summary": {
    "totalSales": 6970782.68,
    "totalCash": 6923657.66,
    "totalVisa": 0,
    "totalCL": 47125.00,
    "totalCover": 5614,
    "cashPercentage": 99.32,
    "visaPercentage": 0,
    "clPercentage": 0.68,
    "averageTicket": 1241.68
  },
  "data": [
    {
      "Rank": 1,
      "Branch_Code": 105,
      "Name": "كرفان التجمع الخامس",
      "Cover": 1820,
      "Cash": 2154300.50,
      "Visa": 0.00,
      "CL": 12500.00,
      "Total": 2166800.50,
      "Market_Share": 31.08,
      "Avg_Ticket": 1190.55
    }
  ]
}
```
