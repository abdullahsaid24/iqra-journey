import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    if (!twilioSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('Twilio credentials not configured');
    }

    // Parse request body to get reminder_key
    const { reminder_key } = await req.json();

    if (!reminder_key) {
      throw new Error('reminder_key is required (e.g. "wednesday_class" or "thursday_class")');
    }

    console.log(`Processing weekly reminder for: ${reminder_key}`);

    // 1. Fetch the reminder config from scheduled_reminders table
    const reminderResponse = await fetch(
      `${supabaseUrl}/rest/v1/scheduled_reminders?reminder_key=eq.${encodeURIComponent(reminder_key)}&select=*&limit=1`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const reminders = await reminderResponse.json();

    if (!reminders || reminders.length === 0) {
      throw new Error(`No reminder found for key: ${reminder_key}`);
    }

    const reminder = reminders[0];

    // Check if reminder is enabled
    if (!reminder.is_enabled) {
      console.log(`Reminder "${reminder_key}" is disabled, skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: 'Reminder is disabled', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const message = reminder.message;
    console.log(`Reminder message: "${message}"`);

    // 2. Map reminder_key to exact class name
    const classNameMap: Record<string, string> = {
      'wednesday_class': 'Wednesday',
      'thursday_class': 'Thursday',
    };

    const className = classNameMap[reminder_key];
    if (!className) {
      throw new Error(`Unknown reminder_key: ${reminder_key}. Expected "wednesday_class" or "thursday_class".`);
    }
    console.log(`Looking for class named "${className}"`);

    // 3. Fetch the class by exact name
    const classesResponse = await fetch(
      `${supabaseUrl}/rest/v1/classes?name=eq.${encodeURIComponent(className)}&select=id,name`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const classes = await classesResponse.json();

    if (!classes || classes.length === 0) {
      console.log(`No class found named "${className}"`);
      return new Response(
        JSON.stringify({ success: true, message: `No class found named "${className}"`, sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const classIds = classes.map((c: any) => c.id);
    console.log(`Found class "${className}" with ${classes.length} match(es)`);

    // 4. Fetch all students in those classes
    const studentClassFilter = classIds.map((id: string) => `class_id.eq.${id}`).join(',');
    const studentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/students?or=(${studentClassFilter})&select=id,name,class_id`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const students = await studentsResponse.json();
    console.log(`Found ${students?.length || 0} students in target classes`);

    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No students in target classes', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const studentIds = students.map((s: any) => s.id);

    // 5. Fetch phone numbers from parent_student_links for these students
    const phoneSet = new Set<string>();

    const studentFilter = studentIds.map((id: string) => `student_id.eq.${id}`).join(',');
    const parentLinksResponse = await fetch(
      `${supabaseUrl}/rest/v1/parent_student_links?or=(${studentFilter})&select=phone_number,secondary_phone_number`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const parentLinks = await parentLinksResponse.json();

    if (parentLinks && Array.isArray(parentLinks)) {
      parentLinks.forEach((link: any) => {
        if (link.phone_number && link.phone_number.trim()) {
          phoneSet.add(link.phone_number.trim());
        }
        if (link.secondary_phone_number && link.secondary_phone_number.trim()) {
          phoneSet.add(link.secondary_phone_number.trim());
        }
      });
    }

    // 6. Also fetch phone numbers from adult_students in these classes
    const adultClassFilter = classIds.map((id: string) => `class_id.eq.${id}`).join(',');
    const adultStudentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/adult_students?or=(${adultClassFilter})&select=phone_number`,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const adultStudents = await adultStudentsResponse.json();

    if (adultStudents && Array.isArray(adultStudents)) {
      adultStudents.forEach((student: any) => {
        if (student.phone_number && student.phone_number.trim()) {
          phoneSet.add(student.phone_number.trim());
        }
      });
    }

    const phoneNumbers = Array.from(phoneSet);
    console.log(`Found ${phoneNumbers.length} unique phone numbers to send reminders to`);

    if (phoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No phone numbers found for target classes', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // 7. Send SMS to each phone number via Twilio
    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const phone of phoneNumbers) {
      try {
        // Normalize phone number — ensure +1 prefix for US/Canada
        let normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (!normalizedPhone.startsWith('+')) {
          if (normalizedPhone.startsWith('1') && normalizedPhone.length === 11) {
            normalizedPhone = '+' + normalizedPhone;
          } else if (normalizedPhone.length === 10) {
            normalizedPhone = '+1' + normalizedPhone;
          } else {
            normalizedPhone = '+' + normalizedPhone;
          }
        }

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;

        const formData = new URLSearchParams();
        formData.append('To', normalizedPhone);
        formData.append('From', twilioPhoneNumber);
        formData.append('Body', message);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (twilioResponse.ok) {
          sentCount++;
          console.log(`SMS sent to ${normalizedPhone}`);
        } else {
          const errorBody = await twilioResponse.text();
          console.error(`Failed to send SMS to ${normalizedPhone}: ${errorBody}`);
          errorCount++;
          errors.push(`${normalizedPhone}: ${errorBody}`);
        }
      } catch (smsError: any) {
        console.error(`Error sending SMS to ${phone}: ${smsError.message}`);
        errorCount++;
        errors.push(`${phone}: ${smsError.message}`);
      }
    }

    console.log(`Reminder complete: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        reminder_key,
        message,
        total_numbers: phoneNumbers.length,
        sent: sentCount,
        errors: errorCount,
        error_details: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(`Error in send-weekly-reminder: ${error.message}`);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
