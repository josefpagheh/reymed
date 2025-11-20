import { PatientHeader } from '@/widgets/PatientHeader';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-100 p-4">
        <h2 className="mb-4 text-lg font-semibold">داشبورد پزشک</h2>
        <nav className="flex flex-col space-y-2">
          <a href="#">داشبورد</a>
          <a href="#">بیماران</a>
          <a href="#">جستجو</a>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <PatientHeader />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
