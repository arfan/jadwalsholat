import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Jadwal Sholat',
  description: 'Jadwal sholat digital dengan clock dan pencarian kota'
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Script src="/lib/bundles/adhan.umd.min.js" strategy="beforeInteractive" />
        <Script src="/lib/moment-with-locales.min.js" strategy="beforeInteractive" />
        <Script src="/lib/moment-timezone-with-data-10-year-range.min.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
