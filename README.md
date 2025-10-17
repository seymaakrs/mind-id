# MindID Admin Panel

MindID için geliştirilmiş admin paneli uygulaması. Instagram, Blog ve HeyGen entegrasyonlarını yönetmek için kullanılır.

## Gereksinimler

- Node.js 18.x veya üzeri
- npm veya yarn paket yöneticisi

## Kurulum

1. Projeyi bilgisayarınıza indirin:
\`\`\`bash
git clone <repository-url>
cd <project-folder>
\`\`\`

2. Bağımlılıkları yükleyin:
\`\`\`bash
npm install
# veya
yarn install
\`\`\`

## Geliştirme Ortamında Çalıştırma

Geliştirme sunucusunu başlatmak için:

\`\`\`bash
npm run dev
# veya
yarn dev
\`\`\`

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışmaya başlayacaktır.

## Production Build

Production için build almak için:

\`\`\`bash
npm run build
# veya
yarn build
\`\`\`

Build alındıktan sonra çalıştırmak için:

\`\`\`bash
npm run start
# veya
yarn start
\`\`\`

## Proje Yapısı

\`\`\`
├── app/
│   ├── layout.tsx          # Ana layout ve font ayarları
│   ├── page.tsx            # Ana sayfa ve menü yapısı
│   └── globals.css         # Global stiller ve tema
├── components/
│   ├── instagram/          # Instagram bileşenleri
│   │   ├── kaynak-ekle.tsx
│   │   ├── icerik-uret.tsx
│   │   └── gonderi-paylas.tsx
│   ├── blog/               # Blog bileşenleri
│   │   └── blog-paylas.tsx
│   └── heygen/             # HeyGen bileşenleri
│       ├── avatar-sec.tsx
│       ├── ses-sec.tsx
│       └── video-olustur.tsx
└── public/                 # Statik dosyalar
\`\`\`

## Özellikler

### Instagram
- Kaynak ekleme
- İçerik üretme
- Gönderi paylaşma

### Blog
- Blog yazıları yayınlama

### HeyGen
- Avatar seçimi ve arama
- Ses seçimi
- Video oluşturma

## Teknolojiler

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui bileşenleri
- Lucide Icons

## Notlar

- Uygulama dark theme kullanmaktadır
- Responsive tasarım için optimize edilmiştir
- Tüm API entegrasyonları sonradan eklenecektir
