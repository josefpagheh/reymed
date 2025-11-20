import React from 'react';
import { PatientHeader } from '@/widgets/PatientHeader';
import CanvasPlaceholder from '@/features/canvas/ui/CanvasPlaceholder';
import OrderingPanel from '@/widgets/OrderingPanel';
import RightSidebar from '@/widgets/RightSidebar';

const DoctorPatientVisitPage = () => {
  return (
    <div className="flex h-screen w-full flex-row-reverse overflow-hidden">
      <RightSidebar />
      <main className="flex flex-1 flex-col p-4">
        <div className="flex-shrink-0">
          <PatientHeader />
        </div>
        <div className="flex-grow py-4">
          <CanvasPlaceholder />
        </div>
        <div className="flex-shrink-0">
          <OrderingPanel />
        </div>
      </main>
    </div>
  );
};

export default DoctorPatientVisitPage;
