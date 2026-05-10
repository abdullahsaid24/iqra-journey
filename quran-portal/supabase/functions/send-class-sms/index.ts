import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import twilio from 'npm:twilio@4.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Class SMS notification request received");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { class_id, message } = await req.json()
    
    if (!class_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing class_id or message parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Class SMS notification request for class ${class_id} with message:`, message);
    
    // First, check if this class has any linked classes
    const { data: linkedClassData } = await supabaseClient
      .from('class_links')
      .select('weekday_class_id, weekend_class_id')
      .or(`weekday_class_id.eq.${class_id},weekend_class_id.eq.${class_id}`)
      .maybeSingle();
    
    // Get all linked class IDs (including the current class)
    const linkedClassIds = [class_id];
    if (linkedClassData) {
      if (linkedClassData.weekday_class_id !== class_id) {
        linkedClassIds.push(linkedClassData.weekday_class_id);
      }
      if (linkedClassData.weekend_class_id !== class_id) {
        linkedClassIds.push(linkedClassData.weekend_class_id);
      }
    }
    
    console.log(`Fetching students for linked class IDs:`, linkedClassIds);
    
    // Get all students in this class AND any linked classes
    const { data: classStudents, error: studentsError } = await supabaseClient
      .from('students')
      .select('id, email')
      .in('class_id', linkedClassIds);
    
    if (studentsError) {
      throw new Error(`Error fetching class students: ${studentsError.message}`)
    }
    
    if (!classStudents || classStudents.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No students found in this class or linked classes', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all class student IDs (for direct parent_student_links lookup)
    const classStudentIds = classStudents.map(s => s.id);

    // Get unique student emails (students can exist in multiple classes)
    const uniqueEmails = [...new Set(classStudents.map(s => s.email).filter(Boolean))];
    console.log(`Found ${classStudents.length} student records, ${uniqueEmails.length} unique emails, ${classStudentIds.length} student IDs`);

    // Get ALL student IDs across all classes that match these emails (for sibling discovery)
    let allStudentIds = [...classStudentIds];
    if (uniqueEmails.length > 0) {
      const { data: allStudentMatches, error: allStudentsError } = await supabaseClient
        .from('students')
        .select('id')
        .in('email', uniqueEmails);
      
      if (allStudentsError) {
        throw new Error(`Error fetching all student matches: ${allStudentsError.message}`)
      }

      // Merge email-matched IDs with direct class student IDs
      const emailMatchedIds = allStudentMatches?.map(s => s.id) || [];
      allStudentIds = [...new Set([...classStudentIds, ...emailMatchedIds])];
    }
    console.log(`Found ${allStudentIds.length} total student IDs (class + email-matched)`);
    
    // Get parent_user_ids for ALL these students (including those with no email)
    const { data: parentUserIds, error: parentUserIdsError } = await supabaseClient
      .from('parent_student_links')
      .select('parent_user_id')
      .in('student_id', allStudentIds);
    
    if (parentUserIdsError) {
      throw new Error(`Error fetching parent user IDs: ${parentUserIdsError.message}`)
    }

    const uniqueParentUserIds = [...new Set(parentUserIds?.map(p => p.parent_user_id) || [])];
    console.log(`Found ${uniqueParentUserIds.length} unique parent users`);

    // Get ALL phone numbers for these parents (from ANY of their links)
    const { data: parentPhoneData, error: parentPhoneError } = await supabaseClient
      .from('parent_student_links')
      .select('phone_number, secondary_phone_number')
      .in('parent_user_id', uniqueParentUserIds)
      .not('phone_number', 'is', null);
    
    if (parentPhoneError) {
      throw new Error(`Error fetching parent phone numbers: ${parentPhoneError.message}`)
    }
    
    // Get adult student phone numbers by email
    let adultStudentPhoneData = [];
    if (uniqueEmails.length > 0) {
      const { data, error: adultStudentPhoneError } = await supabaseClient
        .from('adult_students')
        .select('phone_number')
        .in('email', uniqueEmails)
        .not('phone_number', 'is', null);
        
      if (adultStudentPhoneError) {
        throw new Error(`Error fetching adult student phone numbers: ${adultStudentPhoneError.message}`)
      }
      adultStudentPhoneData = data || [];
    }
    
    // Collect all phone numbers and deduplicate
    const allPhoneNumbers = new Set();
    
    // Add parent primary phone numbers
    parentPhoneData?.forEach(link => {
      if (link.phone_number && link.phone_number.trim()) {
        allPhoneNumbers.add(link.phone_number.trim());
      }
    });
    
    // Add parent secondary phone numbers
    parentPhoneData?.forEach(link => {
      if (link.secondary_phone_number && link.secondary_phone_number.trim()) {
        allPhoneNumbers.add(link.secondary_phone_number.trim());
      }
    });
    
    // Add adult student phone numbers
    adultStudentPhoneData?.forEach(student => {
      if (student.phone_number && student.phone_number.trim()) {
        allPhoneNumbers.add(student.phone_number.trim());
      }
    });
    
    const uniquePhoneNumbers = [...allPhoneNumbers];
    console.log(`Found ${uniquePhoneNumbers.length} unique phone numbers for class ${class_id}`);
    
    if (uniquePhoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No phone numbers found for students in this class', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use the working Twilio phone number
    const twilioPhone = '+15874093011';
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    
    console.log(`Using Twilio phone number: ${twilioPhone}`);
    
    if (!accountSid || !authToken) {
      console.error('Twilio credentials not fully configured');
      return new Response(
        JSON.stringify({ 
          error: 'Twilio configuration error: Missing account SID or auth token',
          sent: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const client = twilio(accountSid, authToken);
    
    let messagesSent = 0;
    let messageErrors = [];
    
    // Strip non-GSM-7 characters (emojis, special unicode) to force cheaper GSM encoding
    // GSM-7: 160 chars/segment vs UCS-2: 70 chars/segment (2-3x more expensive)
    const stripToGSM = (text) => {
      // GSM 7-bit basic character set + extended
      const gsmChars = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ!"#¤%&'()*+,\-.\/0-9:;<=>?¡A-Za-z ÄÖÑÜäöñüà§¿\^{}\[~\]|€\\]*$/;
      
      let result = '';
      for (const char of text) {
        if (gsmChars.test(char)) {
          result += char;
        } else {
          // Common replacements
          const replacements = {
            '\u2018': "'", '\u2019': "'", // smart quotes
            '\u201C': '"', '\u201D': '"', // smart double quotes
            '\u2013': '-', '\u2014': '-', // en/em dash
            '\u2026': '...', // ellipsis
            '\u00A0': ' ', // non-breaking space
          };
          result += replacements[char] || '';
        }
      }
      return result.trim();
    };

    // Strip message to GSM-safe characters
    const cleanMessage = stripToGSM(message);
    console.log(`Original message length: ${message.length}, Cleaned: ${cleanMessage.length}, Stripped ${message.length - cleanMessage.length} non-GSM chars`);

    // Function to validate and format phone numbers
    const validateAndFormatPhone = (phoneNumber) => {
      if (!phoneNumber) return null;
      let cleaned = phoneNumber.trim().replace(/(?!^\+)[^\d]/g, '');
      if (!cleaned.startsWith('+')) {
        cleaned = '+1' + cleaned;
      }
      return cleaned.length >= 11 ? cleaned : null;
    };

    // Send SMS to all unique phone numbers
    for (const phoneNumber of uniquePhoneNumbers) {
      try {
        const formattedPhone = validateAndFormatPhone(phoneNumber);
        if (!formattedPhone) {
          console.error(`Invalid phone number format: ${phoneNumber}`);
          messageErrors.push(`Invalid phone number format: ${phoneNumber}`);
          continue;
        }

        console.log(`Sending SMS to ${formattedPhone}`);
        
        const smsMessage = await client.messages.create({
          body: cleanMessage,
          from: twilioPhone,
          to: formattedPhone
        });

        messagesSent++;
        console.log(`Successfully sent SMS to ${formattedPhone}, Twilio SID: ${smsMessage.sid}`);
      } catch (error) {
        console.error(`Error sending SMS to ${phoneNumber}:`, error.message);
        if (error.code) {
          console.error(`Twilio error code: ${error.code}, More info: ${error.moreInfo || 'Not provided'}`);
          
          // Handle specific Twilio errors
          if (error.code === '21659') {
            messageErrors.push(`Twilio configuration error: The sending phone number ${twilioPhone} is not valid for this account`);
          } else {
            messageErrors.push(`${phoneNumber}: ${error.message}`);
          }
        } else {
          messageErrors.push(`${phoneNumber}: ${error.message}`);
        }
      }
    }
    
    const responseData = {
      message: messagesSent > 0 
        ? `Messages sent to ${messagesSent} recipient${messagesSent === 1 ? '' : 's'} in class`
        : 'No messages were sent',
      sent: messagesSent,
      totalRecipients: uniquePhoneNumbers.length,
      errors: messageErrors.length > 0 ? messageErrors : undefined,
      twilioPhone: twilioPhone
    };

    console.log('Class SMS sending complete:', responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in send-class-sms function:', error);
    return new Response(
      JSON.stringify({ 
        error: `SMS sending failed: ${error.message}`,
        sent: 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
