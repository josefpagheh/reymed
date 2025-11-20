import React from 'react';
import { Card, CardContent } from '@/shared/ui/card';

const HandwritingTab = () => {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex-grow p-2">
        <canvas className="h-full w-full rounded-lg border bg-white" />
      </CardContent>
    </Card>
  );
};

export default HandwritingTab;
