import { useState, useEffect } from "react";
import { Card } from "@/quran/components/ui/card";
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

const REMINDER_CONFIG = {
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

export const ScheduledRemindersTab = () => {
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
    mutationFn: async ({
      reminder_key,
      message,
    }: {
      reminder_key: string;
      message: string;
    }) => {
      const { error } = await supabase
        .from("scheduled_reminders")
        .update({ message })
        .eq("reminder_key", reminder_key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reminders"] });
      toast.success("Reminder message saved successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  // Toggle enabled mutation
  const toggleEnabledMutation = useMutation({
    mutationFn: async ({
      reminder_key,
      is_enabled,
    }: {
      reminder_key: string;
      is_enabled: boolean;
    }) => {
      const { error } = await supabase
        .from("scheduled_reminders")
        .update({ is_enabled })
        .eq("reminder_key", reminder_key);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-reminders"] });
      toast.success(
        `${variables.is_enabled ? "Enabled" : "Disabled"} reminder successfully`
      );
    },
    onError: (error: any) => {
      toast.error(`Failed to toggle: ${error.message}`);
    },
  });

  // Test send mutation (manually invokes the edge function)
  const testSendMutation = useMutation({
    mutationFn: async (reminder_key: string) => {
      setTestingKey(reminder_key);
      const { data, error } = await supabase.functions.invoke(
        "send-weekly-reminder",
        {
          body: { reminder_key },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        `Test sent! ${data.sent || 0} messages delivered, ${data.errors || 0} errors`
      );
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-quran-primary animate-spin" />
      </div>
    );
  }

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-quran-primary/10 rounded-lg">
              <Clock className="h-6 w-6 text-quran-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Scheduled Reminders
              </h2>
              <p className="text-slate-500 text-sm">
                Automated weekly SMS reminders sent to parents at 5:00 PM on
                class days
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>How it works:</strong> These messages are automatically
              sent every Wednesday and Thursday at 5:00 PM (Mountain Time) to
              all parent phone numbers associated with students in the
              respective classes.
            </p>
          </div>
        </div>

        {/* Reminder Cards */}
        <div className="space-y-6">
          {reminders && reminders.length > 0 ? (
            reminders.map((reminder) => {
              const config =
                REMINDER_CONFIG[
                  reminder.reminder_key as keyof typeof REMINDER_CONFIG
                ] || {
                  label: reminder.reminder_key,
                  day: reminder.reminder_key,
                  icon: "📅",
                  color: "bg-slate-50 border-slate-200",
                  badgeColor: "bg-slate-100 text-slate-700",
                };

              return (
                <div
                  key={reminder.id}
                  className={`p-5 border rounded-xl transition-all ${config.color} ${
                    !reminder.is_enabled ? "opacity-60" : ""
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {config.label} Reminder
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={config.badgeColor}
                          >
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Every {config.day}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 text-slate-600"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            5:00 PM MT
                          </Badge>
                          {reminder.is_enabled ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-600"
                            >
                              Disabled
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`toggle-${reminder.reminder_key}`}
                        className="text-sm text-slate-600"
                      >
                        {reminder.is_enabled ? "Enabled" : "Disabled"}
                      </Label>
                      <Switch
                        id={`toggle-${reminder.reminder_key}`}
                        checked={reminder.is_enabled}
                        onCheckedChange={() => handleToggle(reminder)}
                        disabled={toggleEnabledMutation.isPending}
                      />
                    </div>
                  </div>

                  {/* Message Editor */}
                  <div className="space-y-3">
                    <Label
                      htmlFor={`msg-${reminder.reminder_key}`}
                      className="text-sm font-medium text-slate-700 flex items-center gap-1.5"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Reminder Message
                    </Label>
                    <Textarea
                      id={`msg-${reminder.reminder_key}`}
                      value={editedMessages[reminder.reminder_key] || ""}
                      onChange={(e) =>
                        setEditedMessages({
                          ...editedMessages,
                          [reminder.reminder_key]: e.target.value,
                        })
                      }
                      placeholder="Enter reminder message..."
                      className="min-h-[80px] bg-white border-slate-300 text-slate-900 focus:ring-quran-primary placeholder:text-slate-400 resize-none"
                      disabled={!reminder.is_enabled}
                    />

                    {/* Character count */}
                    <p className="text-xs text-slate-400">
                      {(editedMessages[reminder.reminder_key] || "").length}{" "}
                      characters
                      {(editedMessages[reminder.reminder_key] || "").length >
                        160 && (
                        <span className="text-amber-600 ml-1">
                          (may be split into multiple SMS segments)
                        </span>
                      )}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          testSendMutation.mutate(reminder.reminder_key)
                        }
                        disabled={
                          !reminder.is_enabled ||
                          testingKey === reminder.reminder_key
                        }
                        className="text-slate-600 border-slate-300 hover:bg-slate-100"
                      >
                        {testingKey === reminder.reminder_key ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Now (Test)
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => handleSave(reminder.reminder_key)}
                        disabled={
                          !hasChanges(reminder) ||
                          saveMessageMutation.isPending ||
                          !reminder.is_enabled
                        }
                        className="bg-quran-primary hover:bg-quran-primary/90 text-white"
                      >
                        {saveMessageMutation.isPending &&
                          saveMessageMutation.variables?.reminder_key ===
                            reminder.reminder_key && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                        Save Changes
                      </Button>
                    </div>
                  </div>

                  {/* Last updated */}
                  {reminder.updated_at && (
                    <p className="text-xs text-slate-400 mt-3 text-right">
                      Last updated:{" "}
                      {new Date(reminder.updated_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No Scheduled Reminders</p>
              <p className="text-sm mt-1">
                Reminders will appear here after the database migration is
                applied.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
