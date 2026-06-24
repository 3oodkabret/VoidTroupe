================================================================
  VOID TROUPE — Yapay Zeka Destekli Kişilik Analiz Platformu
  Big Five (OCEAN) Kişilik Boyutları Keşif Sistemi
================================================================

PROJE TANIMI
------------
Void Troupe; kullanıcıların serbest metin yazarak Big Five (OCEAN)
kişilik boyutlarını keşfetmelerine olanak tanıyan, yapay zeka
destekli bir kişilik analiz platformudur.

Kullanıcı deneyimi şu adımlardan oluşur:
  1. Hesap oluşturma (kayıt/giriş)
  2. Serbest metin yazarak kişilik analizi başlatma
  3. Radar grafiği, çubuk grafikler ve AI özeti içeren sonuç sayfası
  4. Chrollo chatbot ile analiz sonuçları üzerine konuşma
  5. MBTI tipi kişilik testi
  6. Kişisel analiz geçmişi görüntüleme
  7. 3 dil desteği: Türkçe, Arapça, İngilizce

Analiz motoru olarak Groq API (LLaMA-3.3-70b-versatile modeli),
veritabanı olarak PostgreSQL ve Drizzle ORM kullanılmaktadır.

PROJE MİMARİSİ
--------------
  artifacts/
    api-server/       — Express.js backend (Node.js + TypeScript)
    void-troupe/      — React frontend (Vite + Tailwind CSS)
  lib/
    db/               — Veritabanı şeması (Drizzle ORM + PostgreSQL)
    api-spec/         — OpenAPI spesifikasyonu
    api-client-react/ — Otomatik üretilmiş React Query hook'ları
    api-zod/          — Otomatik üretilmiş Zod doğrulama şemaları
  scripts/            — Yardımcı betikler


================================================================
  BÖLÜM 1 — ONLINE KULLANIM (ÖNERİLEN)
================================================================

Proje tamamen canlıya alınmış ve çalışır durumdadır:

  Frontend (Vercel) : https://void-troupe.vercel.app
  Backend  (Render) : https://voidtroupe.onrender.com
  API Sağlık Kontrolü: https://voidtroupe.onrender.com/api/healthz

Tarayıcıda frontend adresini açmanız yeterlidir. Herhangi bir
kurulum veya yapılandırma gerekmemektedir.

Hesap oluşturmak, analiz yapmak, MBTI testi çözmek ve Chrollo
chatbot ile konuşmak için doğrudan platforma kayıt olabilirsiniz.


================================================================
  BÖLÜM 2 — YEREL ÇALIŞTIRILMASI (LOCAL DEVELOPMENT)
================================================================

Bu projeyi kendi bilgisayarınızda çalıştırmak istiyorsanız aşağıdaki
adımları izleyin.

GEREKSİNİMLER
-------------
Başlamadan önce şunların kurulu olması gerekir:

  1. Node.js (18 veya üzeri sürüm)
     İndirme: https://nodejs.org/

  2. pnpm (paket yöneticisi)
     Kurulum:
       npm install -g pnpm

  3. PostgreSQL (14 veya üzeri sürüm)
     İndirme: https://www.postgresql.org/download/
     Kurulumdan sonra bir veritabanı oluşturun:
       psql -U postgres
       CREATE DATABASE void_troupe;
       \q

  4. Groq API Anahtarı (ücretsiz)
     Kayıt: https://console.groq.com
     API anahtarınızı "API Keys" bölümünden oluşturun.


ORTAM DEĞİŞKENLERİ AYARLAMA
-----------------------------
Proje kök dizininde (README.txt ile aynı klasörde) ".env" adında
bir dosya oluşturun ve aşağıdaki içeriği ekleyin:

  DATABASE_URL=postgresql://postgres:PAROLANIZ@localhost:5432/void_troupe
  SESSION_SECRET=rastgele-uzun-bir-gizli-anahtar-buraya
  PORT=8080
  NODE_ENV=development
  GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
  GROQ_MODEL=llama-3.3-70b-versatile
  FRONTEND_URL=http://localhost:5173

  Notlar:
  - "PAROLANIZ" → PostgreSQL kurulumunda belirlediğiniz parola
  - "SESSION_SECRET" → Rastgele en az 32 karakterlik bir metin
  - "GROQ_API_KEY" → console.groq.com'dan aldığınız anahtar
  - Port 8080 kullanımda ise PORT=8081 olarak değiştirin;
    bu durumda FRONTEND_URL içindeki portu da güncelleyin.


ADIM ADIM KURULUM VE ÇALIŞTIRMA
---------------------------------

Adım 1 — Bağımlılıkları yükleyin (bir kez yapılır)

  pnpm install --ignore-scripts

  NOT (Windows kullanıcıları için):
  Eğer pnpm install hata verirse şu komutu çalıştırın:
    pnpm approve-builds
  ya da:
    pnpm install

--------------------------------------------------------------

Adım 2 — Veritabanı tablolarını oluşturun (bir kez yapılır)

  Terminalde şunu çalıştırın:

    pnpm --filter @workspace/db run push

  Bu komut veritabanında gerekli tabloları (users, analyses,
  password_reset_tokens) otomatik olarak oluşturur.

--------------------------------------------------------------

Adım 3 — Backend'i başlatın (1. terminal penceresi)

  pnpm --filter @workspace/api-server run build
  pnpm --filter @workspace/api-server run start

  API sunucusu şu adreste çalışacaktır:
    http://localhost:8080

  Sağlık kontrolü (tarayıcıdan açın):
    http://localhost:8080/api/healthz
  Yanıt: {"status":"ok"} görmelisiniz.

  NOT: Port 8080 kullanımda ise .env içinde PORT=8081 yapın,
  ardından FRONTEND_URL=http://localhost:5173 olarak kalabilir.

--------------------------------------------------------------

Adım 4 — Frontend'i başlatın (2. terminal penceresi)

  pnpm --filter @workspace/void-troupe run dev

  Uygulama şu adreste açılacaktır:
    http://localhost:5173

--------------------------------------------------------------

Adım 5 — Uygulamayı açın

  Tarayıcınızda http://localhost:5173 adresini ziyaret edin.


YEREL ORTAMDA BAĞLANTI YAPISI
-------------------------------
  Tarayıcı → Frontend (5173) → Backend (8080) → PostgreSQL (5432)

  Frontend; /api ile başlayan istekleri otomatik olarak backend'e
  iletir (vite.config.ts proxy yapılandırması).


PROJE ÖZELLİKLERİ
------------------
  - Kayıt / Giriş / Şifre sıfırlama (e-posta ile)
  - Big Five analizi (AI destekli, min. 50 kelime)
  - Radar grafiği + çubuk grafikler
  - Kişiselleştirilmiş AI özeti (aynı dilde)
  - Chrollo chatbot (psikoloji odaklı)
  - MBTI kişilik testi
  - Kullanıcıya özel analiz geçmişi
  - 3 dil desteği (TR / AR / EN)
  - Mobil uyumlu arayüz


SORUN GİDERME
-------------
  - "Cannot find module" hatası:
      pnpm install
    komutunu tekrar çalıştırın.

  - Veritabanı bağlantı hatası:
      .env dosyasındaki DATABASE_URL'i kontrol edin.
      PostgreSQL servisinin çalıştığından emin olun.

  - "Port already in use" hatası:
      .env içindeki PORT değerini değiştirin (örn: PORT=8081).

  - Tablo bulunamadı hatası:
      pnpm --filter @workspace/db run push
    komutunu tekrar çalıştırın.

  - GROQ_API_KEY hatası:
      console.groq.com adresinden geçerli bir anahtar oluşturun
      ve .env dosyasına ekleyin.

  - Şifre sıfırlama e-postası gelmiyor (yerel ortamda):
      Yerel ortamda e-posta servisi yoktur. E-posta linki terminal
      çıktısına yazdırılır — konsol loglarını kontrol edin.


================================================================
  React, Vite, Tailwind CSS, Express, PostgreSQL,
  Drizzle ORM, Groq AI, Recharts ve TypeScript ile geliştirildi.
================================================================
