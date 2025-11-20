import { PatientHeader } from '@/widgets/PatientHeader';

export default function ClerkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PatientHeader />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
