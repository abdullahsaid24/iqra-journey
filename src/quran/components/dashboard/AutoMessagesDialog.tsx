import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/quran/components/ui/dialog";
import { Textarea } from "@/quran/components/ui/textarea";
import { Label } from "@/quran/components/ui/label";
import { Button } from "@/quran/components/ui/button";
import { Switch } from "@/quran/components/ui/switch";
import { Loader2, Clock, Send, CalendarDays, MessageSquare, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { Badge } from "@/quran/components/ui/badge";

interface ScheduledReminder {
  id: string;
  reminder_key: string;
  message: string;
  is_enabled: boolean;
  send_time: string;
  created_at: string;
  updated_at: string;
}

interface AutoMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REMINDER_CONFIG: Record<string, { label: string; day: string; icon: string; color: string; badgeColor: string }> = {
  wednesday_class: {
    label: "Wednesday Class",
    day: "Wednesday",
    icon: "📅",
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  thursday_class: {
    label: "Thursday Class",
    day: "Thursday",
    icon: "📅",
    color: "bg-emerald-50 border-emerald-200",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
};

export const AutoMessagesDialog = ({ open, onOpenChange }: AutoMessagesDialogProps) => {
  const queryClient = useQueryClient();
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [testingKey, setTestingKey] = useState<string | null>(null);

  // Fetch reminders from DB
  const { data: reminders, isLoading } = useQuery({
    queryKey: ["scheduled-reminders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_reminders")
        .select("*")
        .order("reminder_key");
      if (error) throw error;
      return (data || []) as ScheduledReminder[];
    },
    enabled: open,
  });

  // Initialize edited messages when data loads
  useEffect(() => {
    if (reminders) {
      const messageMap: Record<string, string> = {};
      reminders.forEach((r) => {
        messageMap[r.reminder_key] = r.message;
      });
      setEditedMessages(messageMap);
    }
  }, [reminders]);

  // Save message mutation
  const saveMessageMutation = useMutation({
    mutationFn: async ({ reminder_key, message }: { reminder_key: string; message: string }) => {
      const { error } = await supabase
        .from("scheduled_reminders")
        .update({ message })
        .eq("reminder_key", reminder_key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reminders"] });
      toast.success("Reminder message saved");
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Toggle enabled mutation
  const toggleEnabledMutation = useMutation({
    mutationFn: async ({ reminder_key, is_enabled }: { reminder_key: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("scheduled_reminders")
        .update({ is_enabled })
        .eq("reminder_key", reminder_key);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reminders"] });
      toast.success(`${variables.is_enabled ? "Enabled" : "Disabled"} reminder`);
    },
    onError: (error: any) => {
      toast.error(`Failed to toggle: ${error.message}`);
    },
  });

  // Test send mutation
  const testSendMutation = useMutation({
    mutationFn: async (reminder_key: string) => {
      setTestingKey(reminder_key);
      const { data, error } = await supabase.functions.invoke("send-weekly-reminder", {
        body: { reminder_key },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.message && data.sent === 0) {
        toast.info(`Test result: ${data.message}`);
      } else {
        toast.success(`Test sent! ${data.sent || 0} messages delivered, ${data.errors || 0} errors`);
      }
      setTestingKey(null);
    },
    onError: (error: any) => {
      toast.error(`Test send failed: ${error.message}`);
      setTestingKey(null);
    },
  });

  const handleSave = (reminder_key: string) => {
    const message = editedMessages[reminder_key];
    if (!message?.trim()) {
      toast.error("Message cannot be empty");
      return;
    }
    saveMessageMutation.mutate({ reminder_key, message });
  };

  const handleToggle = (reminder: ScheduledReminder) => {
    toggleEnabledMutation.mutate({
      reminder_key: reminder.reminder_key,
      is_enabled: !reminder.is_enabled,
    });
  };

  const hasChanges = (reminder: ScheduledReminder) => {
    return editedMessages[reminder.reminder_key] !== reminder.message;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-quran-primary" />
            Auto Messages
          </DialogTitle>
          <DialogDescription>
            Edit the weekly SMS reminders sent automatically to parents on class days at 5:00 PM.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 text-quran-primary animate-spin" />
          </div>
        ) : reminders && reminders.length > 0 ? (
          <div className="space-y-4 mt-2">
            {reminders.map((reminder) => {
              const config = REMINDER_CONFIG[reminder.reminder_key] || {
                label: reminder.reminder_key,
                day: reminder.reminder_key,
                icon: "📅",
                color: "bg-slate-50 border-slate-200",
                badgeColor: "bg-slate-100 text-slate-700",
              };

              return (
                <div
                  key={reminder.id}
                  className={`p-4 border rounded-xl transition-all ${config.color} ${
                    !reminder.is_enabled ? "opacity-60" : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{config.icon}</span>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {config.label}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="secondary" className={`text-xs ${config.badgeColor}`}>
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Every {config.day}
                          </Badge>
                          {reminder.is_enabled ? (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-600">
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`dlg-toggle-${reminder.reminder_key}`}
                        className="text-xs text-slate-500"
                      >
                        {reminder.is_enabled ? "On" : "Off"}
                      </Label>
                      <Switch
                        id={`dlg-toggle-${reminder.reminder_key}`}
                        checked={reminder.is_enabled}
                        onCheckedChange={() => handleToggle(reminder)}
                        disabled={toggleEnabledMutation.isPending}
                      />
                    </div>
                  </div>

                  {/* Message Editor */}
                  <div className="space-y-2">
                    <Label
                      htmlFor={`dlg-msg-${reminder.reminder_key}`}
                      className="text-xs font-medium text-slate-600 flex items-center gap-1"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Message
                    </Label>
                    <Textarea
                      id={`dlg-msg-${reminder.reminder_key}`}
                      value={editedMessages[reminder.reminder_key] || ""}
                      onChange={(e) =>
                        setEditedMessages({
                          ...editedMessages,
                          [reminder.reminder_key]: e.target.value,
                        })
                      }
                      placeholder="Enter reminder message..."
                      className="min-h-[70px] bg-white border-slate-300 text-slate-900 focus:ring-quran-primary placeholder:text-slate-400 resize-none text-sm"
                      disabled={!reminder.is_enabled}
                    />

                    {/* Character count */}
                    <p className="text-xs text-slate-400">
                      {(editedMessages[reminder.reminder_key] || "").length} characters
                      {(editedMessages[reminder.reminder_key] || "").length > 160 && (
                        <span className="text-amber-600 ml-1">
                          (may be split into multiple SMS)
                        </span>
                      )}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testSendMutation.mutate(reminder.reminder_key)}
                        disabled={!reminder.is_enabled || testingKey === reminder.reminder_key}
                        className="text-slate-600 border-slate-300 hover:bg-slate-100 text-xs h-8"
                      >
                        {testingKey === reminder.reminder_key ? (
                          <>
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-1.5 h-3 w-3" />
                            Send Now (Test)
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleSave(reminder.reminder_key)}
                        disabled={
                          !hasChanges(reminder) ||
                          saveMessageMutation.isPending ||
                          !reminder.is_enabled
                        }
                        className="bg-quran-primary hover:bg-quran-primary/90 text-white text-xs h-8"
                      >
                        {saveMessageMutation.isPending &&
                          saveMessageMutation.variables?.reminder_key === reminder.reminder_key && (
                            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                          )}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Clock className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No Scheduled Reminders</p>
            <p className="text-xs mt-1">
              Reminders will appear here after the database migration is applied.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
