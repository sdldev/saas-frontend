const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

export function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatViewCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')} rb` : String(n);
}
