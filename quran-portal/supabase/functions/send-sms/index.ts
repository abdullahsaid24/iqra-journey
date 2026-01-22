import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import twilio from 'npm:twilio@4.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Comprehensive function to clean verse references for SMS messages
const cleanVerseReferences = (text) => {
  if (!text) return '';
  
  // Step 1: Replace patterns where surah name is repeated before each verse number
  let cleaned = text.replace(
    /(\w+(?:-\w+)*)\s*(?:verses|ayat|ayah)?\s*(?::\s*)?(\w+-)?\s*(\d+)\s*-\s*(\w+-)?\s*(\d+)/gi, 
    '$1 verses $3-$5'
  );
  
  // Step 2: Clean up any verse reference patterns that still have prefixes
  cleaned = cleaned.replace(
    /verses\s+(\w+(?:-\w+)*):(\w+-)?(\d+)(?:\s*)-(?:\s*)(?:\1:)?(\w+-)?(\d+)/gi,
    'verses $3-$5'
  );
  
  // Step 3: Handle cases where surah name is attached directly to verse numbers
  cleaned = cleaned.replace(
    /(\w+(?:-\w+)*)\s*:\s*(\w+-)?(\d+)\s*-\s*(\w+-)?(\d+)/gi,
    '$1: $3-$5'
  );
  
  // Step 4: Handle specific case for "Surah X verses [prefix]-[prefix]" pattern
  cleaned = cleaned.replace(
    /Surah\s+(\w+(?:-\w+)*)\s+verses\s+(\w+-)?(\d+)-(\w+-)?(\d+)/gi,
    'Surah $1 verses $3-$5'
  );
  
  // Step 5: Remove surah prefixes from verse numbers (e.g., "Aal 1-Aal 40" -> "1-40")
  cleaned = cleaned.replace(
    /(\w+(?:-\w+)*(?::|verses))\s+(\w+-)?(\d+)\s*-\s*(\w+-)?(\d+)/gi,
    '$1 $3-$5'
  );
  
  // Step 6: Direct fix for the specific pattern "Surah X verses Prefix 1-Prefix 40" 
  cleaned = cleaned.replace(
    /Surah\s+(\w+(?:-\w+)*)\s+verses\s+\w+\s+(\d+)-\w+\s+(\d+)/gi,
    'Surah $1 verses $2-$3'
  );
  
  // Step 7: Direct fix for standalone prefixed numbers (e.g., "Aal 1" anywhere in text)
  cleaned = cleaned.replace(/\b([A-Za-z]+-?)\s+(\d+)/g, '$2');
  
  return cleaned;
};

// Function to clean and standardize phone numbers in SMS messages
const cleanPhoneNumbers = (text) => {
  if (!text) return '';
  
  // Fix phone numbers without area code format
  let cleaned = text.replace(/\b(990-7823|990 7823)\b/g, '(780) 990-7823');
  
  // Fix phone numbers with bare area code
  cleaned = cleaned.replace(/\b780\s*[-\s]?990[-\s]?7823\b/g, '(780) 990-7823');
  
  // Fix repeated (780) patterns - match multiple occurrences of (780) and replace with just one
  cleaned = cleaned.replace(/(?:\(780\)\s*){2,}/g, '(780) ');
  
  // Fix issues with extra spaces or missing spaces in phone numbers
  cleaned = cleaned.replace(/\(780\)\s*(\d{3})[-\s]?(\d{4})/g, '(780) $1-$2');
  
  // Fix spaces in phone numbers to ensure consistent format
  cleaned = cleaned.replace(/\(780\)\s*99\s*0[-\s]?7823/g, '(780) 990-7823');
  
  return cleaned;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("SMS notification request received");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { student_id, lesson_id, is_passing, is_homework, debug_mode, sms_message } = await req.json()
    
    if (!student_id || (!lesson_id && !is_homework && !sms_message)) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log("SMS notification request:", { student_id, lesson_id, is_passing, is_homework, debug_mode, sms_message });

    // Get student details including class ID
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('name, class_id, email')
      .eq('id', student_id)
      .single()
    
    if (studentError) {
      throw new Error(`Error fetching student: ${studentError.message}`)
    }

    console.log("Found student:", student);
    
    // Get the class name if available
    let className = null;
    let classId = student?.class_id;
    if (classId) {
      const { data: classData } = await supabaseClient
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();
        
      if (classData) {
        className = classData.name;
        console.log(`Student belongs to class: ${className} (ID: ${classId})`);
      }
    }
    
    let allRecipients = [];
    
    console.log(`Checking adult_students table for phone number with student_id=${student_id}...`);
    const { data: adultStudentData } = await supabaseClient
      .from('adult_students')
      .select('phone_number, email')
      .eq('id', student_id)
      .maybeSingle();
      
    if (adultStudentData?.phone_number) {
      let formattedPhone = adultStudentData.phone_number.trim();
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      console.log(`Found phone in adult_students: ${formattedPhone}`);
      allRecipients.push({
        type: 'adult_student',
        phone_number: formattedPhone,
        email: adultStudentData.email
      });
    } else {
      console.log(`No phone found in adult_students for ID: ${student_id}`);
    }
    
    if (allRecipients.length === 0 && student?.email) {
      console.log(`Looking up adult_students by email: ${student.email}`);
      const { data: adultByEmail } = await supabaseClient
        .from('adult_students')
        .select('phone_number, email')
        .eq('email', student.email)
        .maybeSingle();
        
      if (adultByEmail?.phone_number) {
        let formattedPhone = adultByEmail.phone_number.trim();
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        console.log(`Found phone in adult_students by email: ${formattedPhone}`);
        allRecipients.push({
          type: 'adult_student_by_email',
          phone_number: formattedPhone,
          email: adultByEmail.email
        });
      } else {
        console.log(`No phone found in adult_students for email: ${student.email}`);
      }
    }
    
    console.log("Checking parent_student_links table for direct student link...");
    const { data: parentLinks, error: parentLinksError } = await supabaseClient
      .from('parent_student_links')
      .select('parent_user_id, phone_number, secondary_phone_number')
      .eq('student_id', student_id);
    
    if (parentLinksError) {
      console.error(`Error fetching parent_student_links: ${parentLinksError.message}`);
    }
    
    if (parentLinks && parentLinks.length > 0) {
      console.log(`Found ${parentLinks.length} parent links for student ID: ${student_id}`);
      
      for (const link of parentLinks) {
        // Add primary phone number if available directly on the link
        if (link.phone_number) {
          let formattedPhone = link.phone_number.trim();
          if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
          }
          console.log(`Found primary phone in parent_student_links: ${formattedPhone}`);
          allRecipients.push({
            type: 'parent_primary',
            phone_number: formattedPhone,
            parent_id: link.parent_user_id
          });
        } 
        
        // Add secondary phone number if available directly on the link
        if (link.secondary_phone_number) {
          let formattedPhone = link.secondary_phone_number.trim();
          if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
          }
          console.log(`Found secondary phone in parent_student_links: ${formattedPhone}`);
          allRecipients.push({
            type: 'parent_secondary',
            phone_number: formattedPhone,
            parent_id: link.parent_user_id
          });
        }
        
        // If no phone numbers found directly on the link, check all links for this parent user
        if (!link.phone_number && !link.secondary_phone_number && link.parent_user_id) {
          console.log(`No phone numbers on direct link. Checking other links for parent ID: ${link.parent_user_id}`);
          
          // Get all links for this parent to find a phone number
          const { data: allParentLinks } = await supabaseClient
            .from('parent_student_links')
            .select('phone_number, secondary_phone_number')
            .eq('parent_user_id', link.parent_user_id);
            
          if (allParentLinks?.length > 0) {
            console.log(`Found ${allParentLinks.length} links with phone numbers for parent ID: ${link.parent_user_id}`);
            
            // Use the first available phone number
            const linkWithPhone = allParentLinks.find(pl => pl.phone_number);
            if (linkWithPhone?.phone_number) {
              let formattedPhone = linkWithPhone.phone_number.trim();
              if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+' + formattedPhone;
              }
              console.log(`Using phone from another link for parent: ${formattedPhone}`);
              allRecipients.push({
                type: 'parent_other_link',
                phone_number: formattedPhone,
                parent_id: link.parent_user_id
              });
            }
            
            // Use the first available secondary phone number if there's no primary
            const linkWithSecondary = allParentLinks.find(pl => pl.secondary_phone_number);
            if (linkWithSecondary?.secondary_phone_number) {
              let formattedPhone = linkWithSecondary.secondary_phone_number.trim();
              if (!formattedPhone.startsWith('+')) {
                formattedPhone = '+' + formattedPhone;
              }
              console.log(`Using secondary phone from another link for parent: ${formattedPhone}`);
              allRecipients.push({
                type: 'parent_other_secondary_link',
                phone_number: formattedPhone,
                parent_id: link.parent_user_id
              });
            }
          } else {
            console.log(`No phone numbers found in any link for parent ID: ${link.parent_user_id}`);
          }
        }
      }
    } else {
      console.log(`No parent_student_links found for student ID: ${student_id}`);
    }
    
    console.log(`Found ${allRecipients.length} potential recipients:`, allRecipients);
    
    // Remove duplicates by phone number
    allRecipients = allRecipients.filter((r, index, self) => 
      index === self.findIndex(t => t.phone_number === r.phone_number)
    );
    
    if (allRecipients.length === 0) {
      console.log('No valid recipients found for this student');
      return new Response(
        JSON.stringify({ 
          message: 'No recipients with valid phone numbers found', 
          sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If a custom message was provided, use it directly
    let template = '';
    
    if (sms_message) {
      console.log("Using provided custom message:", sms_message);
      template = sms_message;
    } else {
      // Determine the template type if no custom message
      let templateType = 'lesson_pass';
      if (is_homework) {
        templateType = 'homework_assigned';
      } else if (!is_passing) {
        templateType = 'lesson_fail';
      }
      
      console.log(`Template type determined: ${templateType}`);
      console.log(`Student class_id: ${classId}`);
      
      // Initialize template variables
      let classTemplate = null;
      let globalTemplate = null;
  
      // First try to get class-specific template if we have a class_id
      if (classId) {
        console.log(`Checking for class-specific template for class ${classId} and type ${templateType}`);
        
        const { data: classTemplateData, error: classTemplateError } = await supabaseClient
          .from('class_notification_templates')
          .select('content')
          .eq('class_id', classId)
          .eq('type', templateType)
          .maybeSingle();
  
        if (classTemplateError) {
          console.error(`Error fetching class template: ${classTemplateError.message}`);
        } else if (classTemplateData) {
          console.log(`Found class-specific template for class ${classId} and type ${templateType}`);
          classTemplate = classTemplateData.content;
          console.log(`Class template content: "${classTemplate}"`);
        } else {
          console.log(`No class-specific template found for class ${classId} and type ${templateType}`);
        }
      }
  
      // Get global template as fallback
      console.log(`Fetching global notification template for ${templateType}`);
      const { data: globalTemplateData, error: templatesError } = await supabaseClient
        .from('notification_templates')
        .select('content')
        .eq('type', templateType)
        .maybeSingle();
      
      if (templatesError) {
        console.error(`Error fetching global template: ${templatesError.message}`);
      } else if (globalTemplateData) {
        console.log(`Found global template for type: ${templateType}`);
        globalTemplate = globalTemplateData.content;
        console.log(`Global template content: "${globalTemplate}"`);
      } else {
        console.log(`No global template found for type: ${templateType}`);
      }
      
      // Set default template as fallback
      const defaultTemplates = {
        lesson_pass: 'Iqra Dugsi: {{student_name}} has passed their lesson today! Great work! Their new lesson is {{surah}}: {{verses}}.',
        lesson_fail: 'Iqra Dugsi: {{student_name}} needs more practice with their current lesson {{surah}}: {{verses}}. Please help them review at home.',
        lesson_absent: 'Iqra Dugsi: {{student_name}} was marked absent today. Please inform their mualim if they will be missing class.',
        homework_assigned: 'Iqra Dugsi: New homework has been assigned for {{student_name}}. Please practice {{surah}}: {{verses}}.'
      };
      
      // Use class template if available, otherwise global, otherwise default
      if (classTemplate) {
        template = classTemplate;
        console.log("Using class-specific template");
      } else if (globalTemplate) {
        template = globalTemplate;
        console.log("Using global template");
      } else {
        template = defaultTemplates[templateType] || 'Notification from Quran Academy';
        console.log(`Using default template for type ${templateType}`);
      }
  
      console.log(`Selected template before substitution: "${template}"`);
    }

    // Get the assignment information for substituting template values
    let assignmentInfo = null;
    if (lesson_id) {
      const { data: homework, error: homeworkError } = await supabaseClient
        .from('homework_assignments')
        .select('surah, verses')
        .eq('id', lesson_id)
        .maybeSingle();
      
      if (homeworkError) {
        console.error(`Error fetching homework: ${homeworkError.message}`);
      } else if (homework) {
        assignmentInfo = homework;
        console.log(`Found lesson info: ${JSON.stringify(assignmentInfo)}`);
      }
    }

    // Replace template placeholders with actual values
    if (student && student.name) {
      template = template.replace(/{{student_name}}/g, student.name);
    }
    
    // Replace {{class_name}} with context-appropriate text
    if (className) {
      let classContext = 'class'; // default
      const classNameLower = className.toLowerCase();
      
      // Check if it's a weekend class (Saturday/Sunday)
      if (classNameLower.includes('saturday') || classNameLower.includes('sunday')) {
        classContext = 'Quran';
      } 
      // Check for weekday classes
      else if (classNameLower.includes('thursday')) {
        classContext = 'Thursday class';
      }
      else if (classNameLower.includes('friday')) {
        classContext = 'Friday class';
      }
      else if (classNameLower.includes('monday')) {
        classContext = 'Monday class';
      }
      else if (classNameLower.includes('tuesday')) {
        classContext = 'Tuesday class';
      }
      else if (classNameLower.includes('wednesday')) {
        classContext = 'Wednesday class';
      }
      
      template = template.replace(/\{\{class_name\}\}/g, classContext);
      console.log(`Replaced {{class_name}} with: ${classContext}`);
    }
    
    if (assignmentInfo) {
      if (assignmentInfo.surah) {
        template = template.replace(/{{surah}}/g, assignmentInfo.surah);
      }
      if (assignmentInfo.verses) {
        // Format verses by removing surah number prefixes and cleaning the format thoroughly
        let cleanedVerses = assignmentInfo.verses
          .replace(/(\w+(?:-\w+)*):(\d+)/g, '$2') // Replace "Surah:1" with "1"
          .replace(/(\w+(?:-\w+)*\s+\d+)/g, '$1'); // Keep other formatting
          
        // Additional cleanup to remove remaining prefixes in verse numbers
        cleanedVerses = cleanedVerses.replace(/(\b[A-Za-z]+-?)\s+(\d+)/g, '$2');
        
        template = template.replace(/{{verses}}/g, cleanedVerses);
      }
    }
    
    // Clean the final message to ensure proper verse reference formatting
    // Apply the comprehensive cleaning multiple times to catch nested patterns
    template = cleanVerseReferences(template);
    template = cleanVerseReferences(template); // Second pass to catch any remaining issues
    
    // Clean phone numbers in the template
    template = cleanPhoneNumbers(template);
    
    console.log(`Final message after substitution and cleaning: "${template}"`);

    // Use the correct Twilio phone number here
    const twilioPhone = '+15874093011';
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    
    if (!accountSid || !authToken) {
      console.error('Twilio credentials not fully configured');
      throw new Error('Twilio credentials not fully configured');
    }
    
    const client = twilio(accountSid, authToken);
    
    let messagesSent = 0;
    let messageErrors = [];
    const sentTo = new Set(); // Keep track of numbers we've sent to
    
    // Function to validate and format phone numbers
    const validateAndFormatPhone = (phoneNumber) => {
      if (!phoneNumber) return null;
      let cleaned = phoneNumber.trim().replace(/(?!^\+)[^\d]/g, '');
      if (!cleaned.startsWith('+')) {
        cleaned = '+1' + cleaned;
      }
      return cleaned.length >= 11 ? cleaned : null;
    };

    // Function to send SMS to a specific number
    const sendSMS = async (phoneNumber: string, messageTemplate: string, recipientType: string) => {
      try {
        const formattedPhone = validateAndFormatPhone(phoneNumber);
        if (!formattedPhone) {
          console.error(`Invalid phone number format: ${phoneNumber}`);
          return { success: false, error: 'Invalid phone number format' };
        }

        // Don't send if we've already sent to this number
        if (sentTo.has(formattedPhone)) {
          console.log(`Already sent to ${formattedPhone}, skipping duplicate`);
          return { success: true, skipped: true };
        }

        console.log(`Sending SMS to ${formattedPhone} (${recipientType})`);
        
        const message = await client.messages.create({
          body: messageTemplate,
          from: twilioPhone,
          to: formattedPhone
        });

        sentTo.add(formattedPhone);
        messagesSent++;
        console.log(`Successfully sent SMS to ${formattedPhone}, Twilio SID: ${message.sid}`);
        return { success: true };
      } catch (error) {
        console.error(`Error sending SMS to ${phoneNumber}:`, error.message);
        if (error.code) {
          console.error(`Twilio error code: ${error.code}, More info: ${error.moreInfo || 'Not provided'}`);
        }
        return { success: false, error: error.message };
      }
    };

    console.log(`About to send SMS to ${allRecipients.length} recipients`);
    
    // Process all recipients and send SMS to each phone number
    for (const recipient of allRecipients) {
      console.log(`Processing recipient:`, recipient);
      
      // Send to primary phone number
      if (recipient.phone_number) {
        const result = await sendSMS(recipient.phone_number, template, recipient.type || 'primary');
        if (!result.success && !result.skipped) {
          messageErrors.push(`${recipient.phone_number}: ${result.error}`);
        }
      }
    }
    
    const responseData = {
      message: `Notifications sent to ${messagesSent} recipient${messagesSent === 1 ? '' : 's'}`,
      sent: messagesSent,
      errors: messageErrors.length > 0 ? messageErrors : undefined
    };

    console.log('SMS sending complete:', responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
