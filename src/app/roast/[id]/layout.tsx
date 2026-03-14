export default function RoastLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full flex flex-col" style={{ padding: "0 40px" }}>
      {children}
    </div>
  );
}
