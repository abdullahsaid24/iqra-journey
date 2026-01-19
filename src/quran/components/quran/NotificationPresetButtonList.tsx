
import { Button } from "@/quran/components/ui/button";
import { PresetsByLevel } from "@/quran/components/settings/notification-templates/PresetsByLevel";
import { useState } from "react";
import { toast } from "sonner";

// Update the Preset interface to align with the one in PresetsByLevel
interface Preset {
  id: string;
  content: string;
  type: string;
  level?: number; // Make level optional to handle weekday presets
}

interface NotificationPresetButtonListProps {
  presets: Preset[];
  onSend: (message: string) => void;
}

export function NotificationPresetButtonList({
  presets,
  onSend,
}: NotificationPresetButtonListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  // These functions are stubs as we won't need edit/delete in the modal context
  const handleEdit = () => {};
  const handleDelete = () => {};
  const updatePreset = () => {};

  console.log("Rendering preset buttons with presets:", presets);

  // Make sure all presets have a valid level before rendering
  const presetsWithLevels = presets.map(preset => ({
    ...preset,
    level: preset.level ?? 1 // Default to level 1 if level is not provided
  }));

  const handleSelectPreset = (content: string) => {
    console.log("Selected preset message (before sending):", content);
    
    // Remove any potential message duplication that might have occurred
    let cleanedContent = content;
    
    // Check for exact duplicated text
    const halfLength = content.length / 2;
    const firstHalf = content.substring(0, halfLength);
    const secondHalf = content.substring(halfLength);
    
    // If the first half is repeated in the second half, just use the first half
    if (firstHalf.trim() === secondHalf.trim() && halfLength > 10) {
      cleanedContent = firstHalf;
      console.log("Detected and removed duplicated content");
    }
    
    // Normalize phone number format
    cleanedContent = cleanedContent.replace(/\(?(\d{3})\)?[-\s]?(\d{3})[-\s]?(\d{4})/, '(780) $2-$3');
    cleanedContent = cleanedContent.replace(/990-7823/, '(780) 990-7823');
    cleanedContent = cleanedContent.replace(/780[-\s]?990[-\s]?7823/, '(780) 990-7823');
    
    // Fix the repeated (780) pattern that might appear
    cleanedContent = cleanedContent.replace(/(?:\(780\)\s*){2,}/g, '(780) ');
    
    console.log("Full content being sent (after cleaning):", cleanedContent);
    onSend(cleanedContent.trim());
    toast.success("Message selected");
  };

  return (
    <div className="space-y-4">
      {presetsWithLevels && presetsWithLevels.length > 0 ? (
        <PresetsByLevel
          presets={presetsWithLevels}
          type={presetsWithLevels[0]?.type || ""}
          onEdit={handleEdit}
          onDelete={handleDelete}
          editingId={editingId}
          editingContent={editingContent}
          setEditingContent={setEditingContent}
          updatePreset={updatePreset}
          isReadOnly={true}
          onSelectPreset={handleSelectPreset}
        />
      ) : (
        <p className="text-center text-gray-500 py-4">No preset messages available</p>
      )}
    </div>
  );
}
