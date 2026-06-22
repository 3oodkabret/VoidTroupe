# Void Troupe — تشغيل محلي على Windows

## المتطلبات

- Node.js 18+ — https://nodejs.org/
- pnpm — `npm install -g pnpm`

## 1) تثبيت الحزم (مرة واحدة)

```powershell
cd "D:\they call me body\Desktop\VoidTroupe"
pnpm install --ignore-scripts
```

## 2) Terminal 1 — قاعدة البيانات

**اترك هذه النافذة مفتوحة:**

```powershell
cd "D:\they call me body\Desktop\VoidTroupe"
pnpm --filter @workspace/scripts run start-db
```

## 3) Terminal 2 — إنشاء الجداول (مرة واحدة)

```powershell
cd "D:\they call me body\Desktop\VoidTroupe"
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/void_troupe"
pnpm --filter @workspace/db run push
```

## 4) Terminal 3 — Backend (API)

**مهم:** port 8080 غالباً مشغول على جهازك — استخدم **8081**:

```cmd
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/void_troupe
set SESSION_SECRET=void-troupe-local-dev-secret-2026
set PORT=8081
set NODE_ENV=development
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

اختبار: http://localhost:8081/api/healthz — لازم يرجع JSON زي `{"status":"ok"}`

## 5) Terminal 4 — Frontend

```cmd
set PORT=5173
set BASE_PATH=/
set API_PORT=8081
pnpm --filter @workspace/void-troupe run dev
```

افتح: http://localhost:5173

## ملاحظات

- **8080 مشغول** على جهازك (Planet VPN) — الـ API لازم يشتغل على **8081** والواجهة تستخدم `set API_PORT=8081`
- ملف `.env` موجود في جذر المشروع للمرجع؛ على Windows استخدم `$env:...` كما في الأوامر أعلاه.

## التعديلات على النسخة الأصلية

- `artifacts/void-troupe/vite.config.ts` — proxy لـ `/api` → `localhost:8080`
- `scripts/src/start-db.mjs` — PostgreSQL محلي بدون تثبيت نظام
- `scripts/package.json` — سكربت `start-db` + `embedded-postgres`
- `artifacts/api-server/package.json` — `@esbuild/win32-x64` لـ Windows
