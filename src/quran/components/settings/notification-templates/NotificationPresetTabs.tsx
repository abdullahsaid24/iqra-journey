import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/quran/components/ui/tabs";
interface NotificationPresetTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}
export const NotificationPresetTabs = ({
  activeTab,
  onTabChange
}: NotificationPresetTabsProps) => {
  return <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="w-full justify-start">
        <TabsTrigger value="parent" className="bg-neutral-950 hover:bg-neutral-800 text-neutral-50">Parent</TabsTrigger>
        <TabsTrigger value="adult" className="bg-neutral-950 hover:bg-neutral-800 text-slate-50">Adult</TabsTrigger>
      </TabsList>
    </Tabs>;
};
