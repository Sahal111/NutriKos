// Pengingat untuk lonceng di header. Dihitung dari keadaan aplikasi (tanpa server) sehingga hilang sendiri
// begitu masalahnya teratasi. `biaya` = biaya menu hari ini, `sudahDicatat` = makan hari ini sudah dicatat di Gizi Mingguan.
import { rupiah } from './data';

export function buatNotifikasi({ profile, plan, biaya, sudahDicatat }) {
  const hasil = [];
  if (!plan || plan.length === 0) {
    hasil.push({ id: 'menu', judul: 'Belum ada menu hari ini', isi: 'Buat rekomendasi menu sesuai bujet dan alat masakmu.', href: '/menu' });
  } else {
    if (biaya > (profile?.budget || 0)) {
      hasil.push({ id: 'budget', judul: 'Menu melebihi bujet', isi: `Menu hari ini ${rupiah(biaya)}, bujetmu ${rupiah(profile.budget)}.`, href: '/menu' });
    }
    if (!sudahDicatat) {
      hasil.push({ id: 'catat', judul: 'Catat makan hari ini', isi: 'Catat menu hari ini supaya skor gizi mingguanmu akurat.', href: '/gizi' });
    }
  }
  if (!profile?.stok || profile.stok.length === 0) {
    hasil.push({ id: 'stok', judul: 'Isi bahan stok', isi: 'Tambahkan bahan yang kamu punya agar ide masakan lebih pas.', href: '/bahan-sisa' });
  }
  return hasil;
}
