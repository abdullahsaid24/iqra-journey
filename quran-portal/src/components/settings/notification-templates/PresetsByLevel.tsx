import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2 } from "lucide-react";
interface Preset {
  id: string;
  type: string;
  content: string;
  level: number;
}
interface PresetsByLevelProps {
  presets: Preset[];
  type: string;
  onEdit: (preset: Preset) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  editingContent: string;
  setEditingContent: (content: string) => void;
  updatePreset: (id: string, content: string) => void;
  isReadOnly?: boolean;
  onSelectPreset?: (content: string) => void;
}
const fillPlaceholders = (content: string): string => {
  return content.replace(/{{student_name}}/g, "Ahmed").replace(/{{lesson}}/g, "Al-Fatiha: 1-7").replace(/{{surah}}/g, "Al-Fatiha").replace(/{{verses}}/g, "1-7");
};
export const PresetsByLevel = ({
  presets,
  type,
  onEdit,
  onDelete,
  editingId,
  editingContent,
  setEditingContent,
  updatePreset,
  isReadOnly = false,
  onSelectPreset
}: PresetsByLevelProps) => {
  const presetsByLevel = presets.reduce((acc, preset) => {
    const level = preset.level || 1;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(preset);
    return acc;
  }, {} as Record<number, Preset[]>);
  const levels = Object.keys(presetsByLevel).map(Number).sort();

  // Color schemes for different levels
  const levelColorSchemes = {
    1: {
      header: "bg-blue-50",
      border: "border-blue-200",
      title: "text-blue-800"
    },
    2: {
      header: "bg-purple-50",
      border: "border-purple-200",
      title: "text-purple-800"
    },
    3: {
      header: "bg-emerald-50",
      border: "border-emerald-200",
      title: "text-emerald-800"
    }
  };
  return <div className="space-y-10">
      {levels.map(level => {
      const colorScheme = levelColorSchemes[level as keyof typeof levelColorSchemes] || {
        header: "bg-gray-50",
        border: "border-gray-200",
        title: "text-gray-900"
      };
      return <div key={level} className={`rounded-lg border ${colorScheme.border} shadow-sm bg-white overflow-hidden`}>
            <div className={`${colorScheme.header} px-6 py-4 border-b ${colorScheme.border}`}>
              <h3 className={`font-bold text-xl ${colorScheme.title}`}>Level {level}</h3>
            </div>
            <div className="p-6 space-y-4">
              {presetsByLevel[level].map(preset => <div key={preset.id} className="flex items-center gap-2 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  {editingId === preset.id ? <>
                      <Input value={editingContent} onChange={e => setEditingContent(e.target.value)} className="flex-1 min-h-[60px]" />
                      <Button size="sm" variant="secondary" onClick={() => updatePreset(preset.id, editingContent)} className="bg-neutral-950 hover:bg-neutral-800">
                        Save
                      </Button>
                    </> : <>
                      <div className={`flex-1 ${isReadOnly && onSelectPreset ? 'cursor-pointer hover:bg-gray-50 rounded p-2' : ''}`} onClick={() => isReadOnly && onSelectPreset ? onSelectPreset(preset.content) : null}>
                        <div className="text-sm text-gray-600">{preset.content}</div>
                      </div>
                      {!isReadOnly && <>
                          <Button size="icon" variant="ghost" onClick={() => onEdit(preset)} className="text-slate-500">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => onDelete(preset.id)} className="text-rose-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>}
                    </>}
                </div>)}
            </div>
          </div>;
    })}
    </div>;
};