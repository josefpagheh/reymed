import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/ui/tabs';
import AIChatTab from './AIChatTab';
import SuggestionsTab from './SuggestionsTab';
import HandwritingTab from './HandwritingTab';

const RightSidebar = () => {
  return (
    <aside className="h-screen w-96 overflow-y-auto border-r bg-background">
      <Tabs defaultValue="ai-chat" className="flex h-full w-full flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ai-chat">هوش مصنوعی</TabsTrigger>
          <TabsTrigger value="suggestions">پیشنهادها</TabsTrigger>
          <TabsTrigger value="handwriting">دست‌خط</TabsTrigger>
        </TabsList>
        <TabsContent value="ai-chat" className="flex-grow">
          <AIChatTab />
        </TabsContent>
        <TabsContent value="suggestions" className="flex-grow">
          <SuggestionsTab />
        </TabsContent>
        <TabsContent value="handwriting" className="flex-grow">
          <HandwritingTab />
        </TabsContent>
      </Tabs>
    </aside>
  );
};

export default RightSidebar;
