import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Dashboard Up Total Farma',
  description: 'Dashboard com mapas, preços e unidades da Up Total Farma',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <link rel="stylesheet" href="/leaflet.css" />
        {children}
        <Script src="/leaflet.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
