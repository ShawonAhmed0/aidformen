import "./globals.css";
import localFont from "next/font/local";

const sans = localFont({
  src: "./fonts/Kalpurush.woff2",
  variable: "--font-sans",
  display: "swap",
});

const serif = localFont({
  src: "./fonts/Kalpurush.woff2",
  variable: "--font-serif",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${sans.variable} ${serif.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>

      <body className="font-sans">
        <div>{children}</div>
      </body>
    </html>
  );
}