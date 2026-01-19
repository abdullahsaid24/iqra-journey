import { useState, useEffect } from "react";
import { Card } from "@/quran/components/ui/card";
import { Textarea } from "@/quran/components/ui/textarea";
import { Label } from "@/quran/components/ui/label";
import { Button } from "@/quran/components/ui/button";
import { Loader2, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/quran/lib/supabase";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/quran/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/quran/components/ui/tabs";
import { ClassNotificationTemplates } from "./ClassNotificationTemplates";
import { NotificationPresetManager } from "./NotificationPresetManager";
import { GlobalMessagesTab } from "./GlobalMessagesTab";
type TemplateType = 'lesson_pass' | 'lesson_fail' | 'lesson_absent' | 'homework_assigned' | 'payment_failed';
interface Template {
  id?: string;
  type: TemplateType;
  content: string;
}
export const NotificationTemplatesTab = () => {
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState<Record<TemplateType, string>>({
    lesson_pass: '',
    lesson_fail: '',
    lesson_absent: '',
    homework_assigned: '',
    payment_failed: ''
  });
  const defaultTemplates: Record<TemplateType, string> = {
    lesson_pass: 'Iqra Dugsi: {{student_name}} has passed their lesson today! Great work! Their new lesson is {{surah}} verses {{verses}}.',
    lesson_fail: 'Iqra Dugsi: {{student_name}} needs more practice with their current lesson {{surah}} verses {{verses}}. Please help them review at home.',
    lesson_absent: 'Iqra Dugsi: {{student_name}} was marked absent today. Please inform their mualim if they will be missing class.',
    homework_assigned: 'Iqra Dugsi: New homework has been assigned for {{student_name}}. Please practice {{surah}} verses {{verses}}.',
    payment_failed: 'Assalamu Alaikum. Your payment failed (automated message). Update your card at https://billing.stripe.com/p/login/fZe5mSaqA5iB4I84gg.'
  };
  const {
    data: savedTemplates,
    isLoading
  } = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('notification_templates').select('*');
      if (error) throw error;
      return data || [];
    }
  });
  useEffect(() => {
    if (savedTemplates) {
      const templateMap = savedTemplates.reduce((acc, template) => {
        if (template.type in acc) {
          acc[template.type as TemplateType] = template.content;
        }
        return acc;
      }, {
        ...templates
      });
      setTemplates(templateMap);
    }
  }, [savedTemplates]);
  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      type,
      content
    }: Template) => {
      const {
        data
      } = await supabase.from('notification_templates').select('id').eq('type', type).maybeSingle();
      if (data?.id) {
        const {
          error
        } = await supabase.from('notification_templates').update({
          content
        }).eq('id', data.id);
        if (error) throw error;
        return {
          type,
          content,
          updated: true
        };
      } else {
        const {
          error
        } = await supabase.from('notification_templates').insert({
          type,
          content
        });
        if (error) throw error;
        return {
          type,
          content,
          updated: false
        };
      }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({
        queryKey: ['notification-templates']
      });
      toast.success(`Template ${data.updated ? 'updated' : 'created'} successfully`);
    },
    onError: (error: any) => {
      console.error('Error updating template:', error);
      toast.error(`Failed to update template: ${error.message}`);
    }
  });
  const handleSaveTemplate = (type: TemplateType) => {
    updateTemplateMutation.mutate({
      type,
      content: templates[type] || defaultTemplates[type]
    });
  };
  const templateCards = [{
    type: 'lesson_pass' as TemplateType,
    title: 'Lesson Passed Notification',
    description: 'Sent when a student passes their lesson',
    placeholders: '{{student_name}}, {{surah}}, {{verses}}'
  }, {
    type: 'lesson_fail' as TemplateType,
    title: 'Lesson Failed Notification',
    description: 'Sent when a student fails their lesson',
    placeholders: '{{student_name}}, {{surah}}, {{verses}}'
  }, {
    type: 'lesson_absent' as TemplateType,
    title: 'Absent Notification',
    description: 'Sent when a student is marked absent',
    placeholders: '{{student_name}}'
  }, {
    type: 'homework_assigned' as TemplateType,
    title: 'Homework Assigned Notification',
    description: 'Sent when homework is assigned to a student',
    placeholders: '{{student_name}}, {{surah}}, {{verses}}'
  }, {
    type: 'payment_failed' as TemplateType,
    title: 'Payment Failed Notification',
    description: 'Sent when a payment fails (automated)',
    placeholders: 'None - automated message'
  }];
  const [activeTab, setActiveTab] = useState("global");
  return <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList className="w-full justify-start">
      <TabsTrigger value="global">Global Templates</TabsTrigger>
      <TabsTrigger value="class">Class Templates</TabsTrigger>
      <TabsTrigger value="presets">Presets</TabsTrigger>
      <TabsTrigger value="global-messages">Global Messages</TabsTrigger>
    </TabsList>

    <TabsContent value="global" className="mt-6">
      <Card className="bg-white border-slate-200 shadow-sm">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Notification Templates</h2>
            <p className="text-slate-500">Customize the messages sent to parents.</p>
          </div>

          <div className="space-y-8">
            {templateCards.map(template => <div key={template.type} className="p-4 border border-slate-200 rounded-lg bg-white">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-medium text-slate-900">{template.title}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Available placeholders: {template.placeholders}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-slate-600 mb-1">{template.description}</p>
              <p className="text-xs text-slate-500 mb-3">Available placeholders: {template.placeholders}</p>

              <div className="space-y-3">
                <Label htmlFor={`template-${template.type}`} className="text-slate-700">Message Template</Label>
                <Textarea
                  id={`template-${template.type}`}
                  value={templates[template.type] || ''}
                  onChange={e => setTemplates({ ...templates, [template.type]: e.target.value })}
                  placeholder={defaultTemplates[template.type]}
                  className="min-h-[100px] bg-white border-slate-200 text-slate-900 focus:ring-quran-primary placeholder:text-slate-400"
                />
                <div className="flex justify-end">
                  <Button onClick={() => handleSaveTemplate(template.type)} disabled={updateTemplateMutation.isPending && updateTemplateMutation.variables?.type === template.type} className="bg-quran-primary hover:bg-quran-primary/90 text-white">
                    {updateTemplateMutation.isPending && updateTemplateMutation.variables?.type === template.type && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Template
                  </Button>
                </div>
              </div>
            </div>)}
          </div>
        </div>
      </Card>
    </TabsContent>

    <TabsContent value="class" className="mt-6">
      <ClassNotificationTemplates />
    </TabsContent>

    <TabsContent value="presets" className="mt-6">
      <NotificationPresetManager />
    </TabsContent>

    <TabsContent value="global-messages" className="mt-6">
      <GlobalMessagesTab />
    </TabsContent>
  </Tabs>;
};
