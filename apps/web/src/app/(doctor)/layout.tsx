import PatientHeader from '@/widgets/PatientHeader';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <PatientHeader />
      <main>{children}</main>
    </div>
  );
}
