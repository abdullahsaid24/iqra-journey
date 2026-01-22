import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
type TemplateType = 'lesson_pass' | 'lesson_fail' | 'lesson_absent' | 'homework_assigned';
interface Template {
  id?: string;
  class_id: string;
  type: TemplateType;
  content: string;
}
interface ClassTemplate {
  id: string;
  name: string;
  templates: Record<TemplateType, string>;
}
export const ClassNotificationTemplates = () => {
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [templates, setTemplates] = useState<Record<string, Record<TemplateType, string>>>({});
  const defaultTemplates: Record<TemplateType, string> = {
    lesson_pass: 'Iqra Dugsi: {{student_name}} has passed their lesson today! Great work! Their new lesson is {{surah}} verses {{verses}}.',
    lesson_fail: 'Iqra Dugsi: {{student_name}} needs more practice with their current lesson {{surah}} verses {{verses}}. Please help them review at home.',
    lesson_absent: 'Iqra Dugsi: {{student_name}} was marked absent today. Please inform their mualim if they will be missing class.',
    homework_assigned: 'Iqra Dugsi: New homework has been assigned for {{student_name}}. Please practice {{surah}} verses {{verses}}.'
  };
  const {
    data: classes,
    isLoading: classesLoading
  } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('classes').select('id, name');
      if (error) throw error;
      return data || [];
    }
  });
  const {
    data: savedTemplates,
    isLoading: templatesLoading
  } = useQuery({
    queryKey: ['class-notification-templates'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('class_notification_templates').select('*');
      if (error) throw error;
      return data || [];
    }
  });
  useEffect(() => {
    if (savedTemplates) {
      const templateMap: Record<string, Record<TemplateType, string>> = {};
      savedTemplates.forEach(template => {
        if (!templateMap[template.class_id]) {
          templateMap[template.class_id] = {
            ...defaultTemplates
          };
        }
        templateMap[template.class_id][template.type as TemplateType] = template.content;
      });
      setTemplates(templateMap);
    }
  }, [savedTemplates]);
  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      class_id,
      type,
      content
    }: Template) => {
      const {
        data: existing
      } = await supabase.from('class_notification_templates').select('id').eq('class_id', class_id).eq('type', type).maybeSingle();
      if (existing?.id) {
        const {
          error
        } = await supabase.from('class_notification_templates').update({
          content
        }).eq('id', existing.id);
        if (error) throw error;
        return {
          type,
          content,
          updated: true
        };
      } else {
        const {
          error
        } = await supabase.from('class_notification_templates').insert({
          class_id,
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
        queryKey: ['class-notification-templates']
      });
      toast.success(`Template ${data.updated ? 'updated' : 'created'} successfully`);
    },
    onError: (error: any) => {
      console.error('Error updating template:', error);
      toast.error(`Failed to update template: ${error.message}`);
    }
  });
  const handleSaveTemplate = (type: TemplateType) => {
    if (!selectedClass) {
      toast.error('Please select a class first');
      return;
    }
    updateTemplateMutation.mutate({
      class_id: selectedClass,
      type,
      content: templates[selectedClass]?.[type] || defaultTemplates[type]
    });
  };
  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    if (!templates[classId]) {
      setTemplates({
        ...templates,
        [classId]: {
          ...defaultTemplates
        }
      });
    }
  };
  if (classesLoading || templatesLoading) {
    return <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-quran-primary animate-spin" />
      </div>;
  }
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
  }];
  return <Card className="border border-quran-border bg-white/90 backdrop-blur-sm shadow-lg">
      <div className="p-6 bg-neutral-950">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-quran-bg font-arabic mb-2">Class Notification Templates</h2>
          <p className="text-gray-600">Customize messages sent to parents for each class</p>
          <div className="w-32 h-1 bg-quran-primary mx-auto rounded-full mt-2" />
        </div>

        <div className="mb-6">
          <Label htmlFor="class-select" className="bg-neutral-950">Select Class</Label>
          <Select value={selectedClass} onValueChange={handleClassChange}>
            <SelectTrigger id="class-select" className="w-full">
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((classItem: any) => <SelectItem key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        {selectedClass && <div className="space-y-8">
            {templateCards.map(template => <div key={template.type} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-medium">{template.title}</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-500">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Available placeholders: {template.placeholders}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-gray-600 mb-1">{template.description}</p>
                <p className="text-xs text-gray-500 mb-3">Available placeholders: {template.placeholders}</p>
                
                <div className="space-y-3">
                  <Label htmlFor={`template-${template.type}`}>Message Template</Label>
                  <Textarea id={`template-${template.type}`} value={templates[selectedClass]?.[template.type] || ''} onChange={e => setTemplates({
              ...templates,
              [selectedClass]: {
                ...templates[selectedClass],
                [template.type]: e.target.value
              }
            })} placeholder={defaultTemplates[template.type]} className="min-h-[100px]" />
                  <div className="flex justify-end">
                    <Button onClick={() => handleSaveTemplate(template.type)} disabled={updateTemplateMutation.isPending && updateTemplateMutation.variables?.type === template.type} className="bg-quran-primary hover:bg-quran-primary/90">
                      {updateTemplateMutation.isPending && updateTemplateMutation.variables?.type === template.type && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Template
                    </Button>
                  </div>
                </div>
              </div>)}
          </div>}
      </div>
    </Card>;
};