import React from 'react';
import { Button } from '@/shared/ui/button';

const OrderingPanel = () => {
  return (
    <div className="flex w-full items-center justify-between gap-4 overflow-x-auto rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-shrink-0 items-center gap-2">
        <p className="text-sm text-muted-foreground">آزمایشگاه / درمان / توصیه‌ها</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Button variant="outline">چاپ نسخه</Button>
        <Button>ارسال به سامانه</Button>
      </div>
    </div>
  );
};

export default OrderingPanel;
