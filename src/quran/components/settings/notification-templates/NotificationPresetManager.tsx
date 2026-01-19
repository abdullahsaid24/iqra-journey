import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/quran/components/ui/card";
import { Button } from "@/quran/components/ui/button";
import { Input } from "@/quran/components/ui/input";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { NotificationPresetTabs } from "./NotificationPresetTabs";
import { PresetsByLevel } from "./PresetsByLevel";
type TemplateType = "lesson_fail" | "lesson_absent" | "lesson_repeat";
interface NotificationPreset {
  id: string;
  type: TemplateType;
  content: string;
  level: number;
  is_adult?: boolean;
}
export const NotificationPresetManager = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("parent");
  const [newType, setNewType] = useState<TemplateType>("lesson_fail");
  const [newContent, setNewContent] = useState("");
  const [newLevel, setNewLevel] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const {
    data: presets,
    isLoading
  } = useQuery<NotificationPreset[]>({
    queryKey: ['notification-presets'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("notification_presets").select("*").order("level", {
        ascending: true
      });
      if (error) throw error;
      return (data ?? []) as unknown as NotificationPreset[];
    }
  });
  const addPreset = useMutation({
    mutationFn: async ({
      type,
      content,
      level,
      is_adult
    }: {
      type: TemplateType;
      content: string;
      level: number;
      is_adult: boolean;
    }) => {
      const {
        error
      } = await supabase.from("notification_presets").insert({
        type,
        content,
        level,
        is_adult
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-presets']
      });
      setNewContent("");
      toast.success("Preset added");
    },
    onError: (e: any) => toast.error(e.message)
  });
  const updatePreset = useMutation({
    mutationFn: async ({
      id,
      content
    }: {
      id: string;
      content: string;
    }) => {
      const {
        error
      } = await supabase.from("notification_presets").update({
        content
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-presets']
      });
      setEditingId(null);
      toast.success("Preset updated");
    },
    onError: (e: any) => toast.error(e.message)
  });
  const deletePreset = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from("notification_presets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notification-presets']
      });
      toast.success("Preset deleted");
    },
    onError: (e: any) => toast.error(e.message)
  });
  const filteredPresets = presets?.filter(p => activeTab === "adult" ? p.is_adult : !p.is_adult) ?? [];
  return <Card className="p-6 mt-8 border border-quran-border bg-neutral-50">
      <h3 className="text-2xl font-semibold mb-4 text-quran-bg">Custom Notification Presets</h3>
      
      <NotificationPresetTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex items-end gap-2 mb-6 mt-4">
        <select value={newType} onChange={e => setNewType(e.target.value as TemplateType)} className="border rounded px-2 py-1">
          <option value="lesson_fail">Lesson Fail</option>
          <option value="lesson_absent">Lesson Absent</option>
          <option value="lesson_repeat">Lesson Repeat</option>
        </select>
        <select value={newLevel} onChange={e => setNewLevel(Number(e.target.value))} className="border rounded px-2 py-1">
          <option value={1}>Level 1</option>
          <option value={2}>Level 2</option>
          <option value={3}>Level 3</option>
        </select>
        <Input placeholder="Preset message" value={newContent} onChange={e => setNewContent(e.target.value)} className="flex-1" />
        <Button onClick={() => {
        if (newContent.trim()) {
          addPreset.mutate({
            type: newType,
            content: newContent.trim(),
            level: newLevel,
            is_adult: activeTab === "adult"
          });
        }
      }} disabled={addPreset.isPending} className="bg-neutral-950 hover:bg-neutral-800 text-neutral-50">
          {addPreset.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Plus />}
          Add
        </Button>
      </div>

      {isLoading ? <div className="p-2 text-center">
          <Loader2 className="animate-spin h-4 w-4 mx-auto" />
        </div> : <div>
          {Object.entries(filteredPresets.reduce((acc, preset) => {
        if (!acc[preset.type]) {
          acc[preset.type] = [];
        }
        acc[preset.type].push(preset);
        return acc;
      }, {} as Record<string, NotificationPreset[]>)).map(([type, typePresets]) => <div key={type}>
              <div className="font-bold text-lg mt-4 mb-2 bg-neutral-950">
                {type === "lesson_fail" ? "Lesson Failed" : type === "lesson_repeat" ? "Lesson Repeat" : "Lesson Absent"}
              </div>
              <PresetsByLevel presets={typePresets} type={type} onEdit={preset => {
          setEditingId(preset.id);
          setEditingContent(preset.content);
        }} onDelete={id => deletePreset.mutate(id)} editingId={editingId} editingContent={editingContent} setEditingContent={setEditingContent} updatePreset={(id, content) => updatePreset.mutate({
          id,
          content
        })} />
            </div>)}
        </div>}
    </Card>;
};
