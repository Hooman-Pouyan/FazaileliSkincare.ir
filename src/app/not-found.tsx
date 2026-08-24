export default function NotFound() {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          background: "var(--ground)",
          color: "var(--ink)",
          fontFamily: "var(--font-fa)",
        }}
      >
        <p>صفحه‌ای که دنبالش بودید پیدا نشد.</p>
      </body>
    </html>
  );
}
