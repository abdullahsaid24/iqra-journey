import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not configured');
    if (!twilioSid || !twilioAuthToken || !twilioPhoneNumber) throw new Error('Twilio credentials not configured');

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      }
    });

    const { reminder_key } = await req.json();
    if (!reminder_key) throw new Error('reminder_key required');

    // 1. Fetch reminder config
    const { data: reminderData, error: reminderError } = await supabase
      .from('scheduled_reminders')
      .select('*')
      .eq('reminder_key', reminder_key)
      .single();

    if (reminderError || !reminderData) throw new Error(`No reminder found: ${reminder_key}`);
    console.log(`Loaded config for ${reminder_key}, enabled: ${reminderData.is_enabled}`);
    if (!reminderData.is_enabled) {
      console.log('Reminder is disabled, aborting test.');
      return new Response(JSON.stringify({ success: true, message: 'disabled', sent: 0 }), { headers: corsHeaders });
    }

    const message = reminderData.message;
    console.log('Sending message:', message);

    // 2. Find target classes
    // Use known class IDs for reliable matching, with name-based fallback
    const classIdMap: Record<string, string[]> = {
      'wednesday_class': ['74410dba-7cee-41ab-81c0-a8bbe3e7a042'],
      'thursday_class': ['ee5cf54f-e467-4654-8d7e-051a259d27e4'],
    };

    const classNameMap: Record<string, string> = {
      'wednesday_class': 'Wednesday',
      'thursday_class': 'Thursday',
    };

    let classIds: string[] = [];

    // Try direct ID mapping first
    if (classIdMap[reminder_key]) {
      // Verify these IDs actually exist
      const { data: verifiedClasses } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIdMap[reminder_key]);

      if (verifiedClasses && verifiedClasses.length > 0) {
        classIds = verifiedClasses.map(c => c.id);
        console.log(`Matched ${classIds.length} classes by ID: ${verifiedClasses.map(c => c.name).join(', ')}`);
      }
    }

    // Fallback: search by name if ID matching failed
    if (classIds.length === 0) {
      const className = classNameMap[reminder_key];
      if (!className) throw new Error(`Unknown reminder_key: ${reminder_key}`);

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .ilike('name', `%${className}%`);

      if (classes && classes.length > 0) {
        classIds = classes.map(c => c.id);
        console.log(`Matched ${classIds.length} classes by name search for "${className}": ${classes.map(c => c.name).join(', ')}`);
      }
    }

    if (classIds.length === 0) {
      console.log('No matching classes found, aborting.');
      return new Response(JSON.stringify({ success: true, message: `No class found for "${reminder_key}"`, sent: 0 }), { headers: corsHeaders });
    }

    // 4. Exact matching from ClassMessageDialog.tsx
    // Get linked classes just in case
    const linkedClassIds = new Set(classIds);
    for (const cid of classIds) {
      const { data: linked } = await supabase
        .from('class_links')
        .select('weekday_class_id, weekend_class_id')
        .or(`weekday_class_id.eq.${cid},weekend_class_id.eq.${cid}`)
        .maybeSingle();
      
      if (linked) {
        if (linked.weekday_class_id) linkedClassIds.add(linked.weekday_class_id);
        if (linked.weekend_class_id) linkedClassIds.add(linked.weekend_class_id);
      }
    }
    const allLinkedClassIds = Array.from(linkedClassIds);

    // Get basic students
    const { data: students } = await supabase
      .from('students')
      .select('id, name, email')
      .in('class_id', allLinkedClassIds);

    console.log(`Found ${students?.length || 0} students across ${allLinkedClassIds.length} linked classes.`);
    if (!students || students.length === 0) {
      console.log('No students found in these classes, aborting.');
      return new Response(JSON.stringify({ success: true, message: 'No students in target classes', sent: 0 }), { headers: corsHeaders });
    }

    const uniqueEmails = [...new Set(students.map(s => s.email).filter(Boolean))];
    console.log(`Found ${uniqueEmails.length} unique student emails.`);
    if (uniqueEmails.length === 0) {
      console.log('No student emails found, aborting.');
      return new Response(JSON.stringify({ success: true, message: 'No student emails found', sent: 0 }), { headers: corsHeaders });
    }
    
    // Find ALL student profiles for these emails to catch parents cross-linked to siblings
    const { data: allStudentMatches } = await supabase
      .from('students')
      .select('id')
      .in('email', uniqueEmails);
      
    const allStudentIds = allStudentMatches?.map(s => s.id) || [];

    // Get parent routing
    const { data: parentUserIds } = await supabase
      .from('parent_student_links')
      .select('parent_user_id')
      .in('student_id', allStudentIds);
      
    const uniqueParentUserIds = [...new Set(parentUserIds?.map(p => p.parent_user_id) || [])];

    // Grab phones for parents
    const { data: parentLinks } = await supabase
      .from('parent_student_links')
      .select('phone_number, secondary_phone_number')
      .in('parent_user_id', uniqueParentUserIds);

    // Grab phones for adults
    const { data: adultStudents } = await supabase
      .from('adult_students')
      .select('phone_number')
      .in('email', uniqueEmails);

    const phoneNumbers = new Set<string>();

    parentLinks?.forEach(link => {
      if (link.phone_number?.trim()) phoneNumbers.add(link.phone_number.trim());
      if (link.secondary_phone_number?.trim()) phoneNumbers.add(link.secondary_phone_number.trim());
    });

    adultStudents?.forEach(adult => {
      if (adult.phone_number?.trim()) phoneNumbers.add(adult.phone_number.trim());
    });

    const phones = Array.from(phoneNumbers);
    console.log(`Final count of unique phone numbers to SMS: ${phones.length}`);
    if (phones.length === 0) {
      console.log('No phone numbers extracted from parents/adults, aborting.');
      return new Response(JSON.stringify({ success: true, message: 'No phone numbers found', sent: 0 }), { headers: corsHeaders });
    }

    // 5. Send via Twilio
    let sentCount = 0;
    let errorCount = 0;
    
    for (const phone of phones) {
      let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      if (!normalizedPhone.startsWith('+')) {
        if (normalizedPhone.length === 10) normalizedPhone = '+1' + normalizedPhone;
        else if (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')) normalizedPhone = '+' + normalizedPhone;
        else normalizedPhone = '+' + normalizedPhone;
      }

      try {
        const formData = new URLSearchParams();
        formData.append('To', normalizedPhone);
        formData.append('From', twilioPhoneNumber);
        formData.append('Body', message);

        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });

        if (twilioRes.ok) sentCount++;
        else errorCount++;
      } catch (err) {
        errorCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Success', sent: sentCount, errors: errorCount }), { headers: corsHeaders });
  } catch (error: any) {
    console.error(`Edge function error: ${error.message}`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
