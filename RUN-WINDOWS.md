# Void Troupe — تشغيل محلي على Windows

## المتطلبات

- Node.js 18+ — https://nodejs.org/
- pnpm — `npm install -g pnpm`

## 0) افتح مجلد المشروع

**مهم:** اسم المستخدم فيه مسافات (`they call me body`) — لازم الأوامر بين علامات تنصيص `"..."`.

### الطريقة الأسهل (بدون cd)

1. افتح File Explorer
2. روح لـ `Desktop` → مجلد `VoidTroupe`
3. اضغط على شريط العنوان واكتب `cmd` ثم Enter  
   → هيفتح CMD **جوه المجلد الصح** مباشرة

### أو من CMD

```cmd
cd /d "C:\Users\they call me body\Desktop\VoidTroupe"
```

> **ملاحظة:** لو الـ prompt بيقول `...\VoidTroupe>` أنت **أصلاً في المجلد الصح** — متعملش `cd` تاني، كمل الخطوات اللي تحت.

### تأكد إنك في المكان الصح

```cmd
dir package.json
dir RUN-WINDOWS.md
```

لو ظهروا = تمام. لو `File Not Found` = فكّيت الـ zip في مكان تاني أو المجلد غلط.

## 1) تثبيت الحزم (مرة واحدة)

```cmd
pnpm install --ignore-scripts
```

## 2) Terminal 1 — قاعدة البيانات

**اترك هذه النافذة مفتوحة:**

```cmd
pnpm --filter @workspace/scripts run start-db
```

## 3) Terminal 2 — إنشاء الجداول (مرة واحدة)

```cmd
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/void_troupe
pnpm --filter @workspace/db run push
```

## 4) Terminal 3 — Backend (API)

```cmd
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/void_troupe
set SESSION_SECRET=void-troupe-local-dev-secret-2026
set PORT=8081
set NODE_ENV=development
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

اختبار: http://localhost:8080/api/healthz

## 5) Terminal 4 — Frontend

```cmd
set PORT=5173
set BASE_PATH=/
pnpm --filter @workspace/void-troupe run dev
```

افتح: http://localhost:5173

## ملاحظات

- إذا كان port 8080 مشغولاً، غيّر `set PORT=8081` وعدّل `artifacts/void-troupe/vite.config.ts` (قيمة proxy target).
- ملف `.env` موجود في جذر المشروع للمرجع؛ في CMD استخدم `set` كما في الأوامر أعلاه.

## حل مشكلة `The system cannot find the path specified`

1. **متكررش `cd`** لو الـ prompt فيه `VoidTroupe>` — أنت جاهز.
2. استخدم `cd /d "C:\Users\they call me body\Desktop\VoidTroupe"` (مع `/d` وعلامات `"` عادية).
3. افتح CMD من داخل المجلد (File Explorer → اكتب `cmd` في شريط العنوان).
4. تأكد إن `dir package.json` يشتغل قبل أي أمر تاني.

## حل خطأ Frontend / Vite: `@rollup/rollup-win32-x64-msvc`

المشروع كان بيستبعد حزم Windows. نفّذ:

```cmd
pnpm add -D @rollup/rollup-win32-x64-msvc@4.62.0 @tailwindcss/oxide-win32-x64-msvc@4.3.1 lightningcss-win32-x64-msvc@1.32.0 -w --ignore-scripts
pnpm install --ignore-scripts
```

بعدها أعد Terminal 4:

```cmd
set PORT=5173
set BASE_PATH=/
pnpm --filter @workspace/void-troupe run dev
```

> تأكد إن `set PORT` و `set BASE_PATH` اتعملوا **قبل** أمر `dev` — من غيرهم Vite هيفشل.

عدّل ملف `lib/db/drizzle.config.ts` ليكون السطر:

```ts
schema: "./src/schema/*.ts",
```

بدل `path.join(__dirname, "./src/schema/index.ts")` — ده بيحل مشكلة على Windows مع مسارات فيها مسافات.

بعدها أعد:

```cmd
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/void_troupe
pnpm --filter @workspace/db run push
```

```cmd
pnpm add -D @esbuild/win32-x64@0.27.3 -w --ignore-scripts
pnpm install --ignore-scripts
```

بعدها أعد:

```cmd
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/void_troupe
pnpm --filter @workspace/db run push
```

## التعديلات على النسخة الأصلية

- `artifacts/void-troupe/vite.config.ts` — proxy لـ `/api` → `localhost:8080`
- `scripts/src/start-db.mjs` — PostgreSQL محلي بدون تثبيت نظام
- `scripts/package.json` — سكربت `start-db` + `embedded-postgres`
- `artifacts/api-server/package.json` — `@esbuild/win32-x64` لـ Windows
