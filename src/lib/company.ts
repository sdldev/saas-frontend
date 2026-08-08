// Data mock corporate (v1) — satu-satunya sumber konten landing.
// Konten statis; bila nanti dinamis, ganti sumber di sini saja.

export interface ServiceItem {
  icon: string;
  title: string;
  description: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export const TAGLINE =
  'Menghadirkan informasi akurat dan berimbang untuk Nusantara';

export const SERVICES: ServiceItem[] = [
  {
    icon: '📰',
    title: 'Berita Terkini',
    description:
      'Informasi politik, ekonomi, teknologi, dan olahraga yang cepat, akurat, dan terverifikasi.',
  },
  {
    icon: '🎥',
    title: 'Liputan Multimedia',
    description:
      'Konten foto dan video jurnalistik dari tim peliput di berbagai daerah.',
  },
  {
    icon: '🤝',
    title: 'Kemitraan Konten',
    description:
      'Sindikasi berita dan kolaborasi konten dengan media serta institusi.',
  },
  {
    icon: '📣',
    title: 'Layanan Iklan',
    description:
      'Penempatan banner dan konten bersponsor untuk menjangkau pembaca kami.',
  },
];

export const STATS: StatItem[] = [
  { value: '10+', label: 'Tahun Beroperasi' },
  { value: '14', label: 'Artikel Terbit' },
  { value: '4', label: 'Kategori Berita' },
  { value: '1 Jt+', label: 'Pembaca per Bulan' },
];

export const PROFILE = {
  short:
    'PT Media Nusantara adalah perusahaan media digital yang menghadirkan jurnalisme independen, cepat, dan berimbang untuk pembaca di seluruh Nusantara.',
  long: [
    'Berdiri sejak lebih dari satu dekade lalu, PT Media Nusantara tumbuh dari ruang redaksi kecil menjadi portal berita multi-platform yang dipercaya jutaan pembaca setiap bulannya. Kami meliput politik, ekonomi, teknologi, dan olahraga dengan standar verifikasi yang ketat.',
    'Redaksi kami didukung tim multimedia yang memproduksi foto dan video jurnalistik, serta jaringan koresponden di berbagai daerah. Setiap berita melalui proses penyuntingan berjenjang sebelum dipublikasikan.',
    'Selain penerbitan berita, kami membuka kemitraan sindikasi konten dengan media dan institusi, serta layanan periklanan digital yang transparan dan terukur.',
  ],
};

export const CONTACTS = {
  email: 'info@media-nusantara.com',
  phone: '(021) 555-0123',
  address: 'Jl. Kebon Sirih No. 10, Jakarta Pusat, Indonesia',
};
