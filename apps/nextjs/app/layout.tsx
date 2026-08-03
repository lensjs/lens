import type { ReactNode } from "react";

export const metadata = {
  title: "Lens + Next.js example",
  description: "LensJS App Router adapter demo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
