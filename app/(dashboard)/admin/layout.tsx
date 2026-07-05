export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth + role checks run in middleware; profile loads once in the dashboard layout.
  return children;
}
