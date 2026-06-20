import "./globals.css";
import { Noto_Sans_Bengali, Noto_Serif_Bengali } from "next/font/google";

const sans = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

const serif = Noto_Serif_Bengali({
  subsets: ["bengali"],
  weight: ["400", "700"],
  variable: "--font-serif",
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

      <body className="font-sans"><div>
        {children}
      </div>
      </body>
    </html >
  );
}