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
    console.log("Global SMS notification request received");
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { message } = await req.json()
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Missing message parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log("Global SMS notification request with message:", message);
    
    // Get all unique phone numbers from parent_student_links
    const { data: parentPhoneData, error: parentPhoneError } = await supabaseClient
      .from('parent_student_links')
      .select('phone_number, secondary_phone_number')
      .not('phone_number', 'is', null);
    
    if (parentPhoneError) {
      throw new Error(`Error fetching parent phone numbers: ${parentPhoneError.message}`)
    }
    
    // Get all unique phone numbers from adult_students
    const { data: adultStudentPhoneData, error: adultStudentPhoneError } = await supabaseClient
      .from('adult_students')
      .select('phone_number')
      .not('phone_number', 'is', null);
      
    if (adultStudentPhoneError) {
      throw new Error(`Error fetching adult student phone numbers: ${adultStudentPhoneError.message}`)
    }
    
    // Collect all phone numbers
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
    console.log(`Found ${uniquePhoneNumbers.length} unique phone numbers`);
    
    if (uniquePhoneNumbers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No phone numbers found in the system', sent: 0 }),
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
          body: message,
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
        ? `Messages sent to ${messagesSent} recipient${messagesSent === 1 ? '' : 's'}`
        : 'No messages were sent',
      sent: messagesSent,
      totalRecipients: uniquePhoneNumbers.length,
      errors: messageErrors.length > 0 ? messageErrors : undefined,
      twilioPhone: twilioPhone
    };

    console.log('Global SMS sending complete:', responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in send-global-sms function:', error);
    return new Response(
      JSON.stringify({ 
        error: `SMS sending failed: ${error.message}`,
        sent: 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
