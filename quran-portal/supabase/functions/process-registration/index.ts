import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { registrationId, classAssignments } = await req.json();

    if (!registrationId || !classAssignments) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing registration:', registrationId);

    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        registration_students (
          id,
          name,
          age
        )
      `)
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      console.error('Error fetching registration:', regError);
      return new Response(
        JSON.stringify({ error: 'Registration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Registration data:', registration);
    const students = registration.registration_students || [];
    const results: any = { created: [], errors: [] };

    // Create parent user account if needed
    let parentUserId = null;
    
    // Check if parent user already exists
    const { data: existingParent } = await supabase.rpc('get_user_by_email', {
      p_email: registration.email
    });

    if (existingParent && existingParent.length > 0) {
      console.log('Parent user already exists:', existingParent[0].id);
      parentUserId = existingParent[0].id;
    } else if (registration.registration_type === 'parent' || registration.registration_type === 'adult') {
      console.log('Creating parent account for:', registration.email);
      
      try {
        // Create auth user for parent
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: registration.email,
          password: Math.random().toString(36).slice(-12) + 'Aa1!',
          email_confirm: true,
          user_metadata: {
            first_name: registration.parent_name?.split(' ')[0] || '',
            last_name: registration.parent_name?.split(' ').slice(1).join(' ') || '',
          }
        });

        if (authError) {
          console.error('Error creating parent auth user:', authError);
          results.errors.push({ type: 'parent', error: authError.message });
        } else {
          parentUserId = authUser.user.id;
          
          // Create user role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: parentUserId,
              role: 'parent'
            });

          if (roleError) {
            console.error('Error creating parent role:', roleError);
            results.errors.push({ type: 'parent_role', error: roleError.message });
          }

          // Create notification preferences
          const { error: notifError } = await supabase
            .from('notification_preferences')
            .insert({
              parent_user_id: parentUserId,
              phone_number: registration.phone,
              homework_assigned: true,
              lesson_pass: true,
              lesson_fail: true
            });

          if (notifError) {
            console.error('Error creating notification preferences:', notifError);
          }

          results.created.push({ type: 'parent', email: registration.email });
          console.log('Parent account created successfully:', parentUserId);
        }
      } catch (error: any) {
        console.error('Exception creating parent:', error);
        results.errors.push({ type: 'parent', error: error.message });
      }
    }

    // Handle adult registration - create student auth accounts
    if (registration.registration_type === 'adult') {
      console.log('Processing adult registration - creating student auth accounts...');
      
      for (const student of students) {
        const classId = classAssignments[student.id];
        if (!classId) {
          console.warn(`No class assigned for adult student ${student.name}`);
          continue;
        }

        try {
          // Generate unique email for student auth account
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const studentEmail = `${student.name.toLowerCase().replace(/\s+/g, '.')}.${randomSuffix}@iqra.com`;

          // Create student auth user
          const { data: studentAuthUser, error: studentAuthError } = await supabase.auth.admin.createUser({
            email: studentEmail,
            password: Math.random().toString(36).slice(-12) + 'Aa1!',
            email_confirm: true,
            user_metadata: {
              name: student.name
            }
          });

          if (studentAuthError) {
            console.error('Error creating student auth user:', studentAuthError);
            results.errors.push({ 
              type: 'adult_student_auth', 
              name: student.name, 
              error: studentAuthError.message 
            });
            continue;
          }

          console.log('Student auth user created:', studentAuthUser.user.id);

          // Create student role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: studentAuthUser.user.id,
              role: 'student'
            });

          if (roleError) {
            console.error('Error creating student role:', roleError);
            results.errors.push({ 
              type: 'adult_student_role', 
              name: student.name, 
              error: roleError.message 
            });
          }

          // Create student record with the auth email
          const { data: newStudent, error: studentError } = await supabase
            .from('students')
            .insert({
              name: student.name,
              first_name: student.name.split(' ')[0],
              last_name: student.name.split(' ').slice(1).join(' ') || '',
              email: studentEmail,
              class_id: classId,
              absence_level: 1,
              failure_level: 1,
              consecutive_absences: 0
            })
            .select()
            .single();

          if (studentError) {
            console.error(`Error creating adult student record ${student.name}:`, studentError);
            results.errors.push({ 
              type: 'adult_student', 
              name: student.name, 
              error: studentError.message 
            });
            continue;
          }

          // Link student to parent
          if (parentUserId && newStudent) {
            await supabase.from('parent_student_links').insert({
              parent_user_id: parentUserId,
              student_id: newStudent.id,
              phone_number: registration.phone
            });
          }

          results.created.push({ 
            type: 'adult_student', 
            name: student.name,
            email: studentEmail,
            classId,
            linkedToParent: true
          });
          console.log(`Adult student ${student.name} created with auth account and linked to parent`);

        } catch (error: any) {
          console.error(`Exception creating adult student ${student.name}:`, error);
          results.errors.push({ 
            type: 'adult_student', 
            name: student.name, 
            error: error.message 
          });
        }
      }
    } else {
      // Regular parent registration - create student accounts and link
      for (const student of students) {
        const classId = classAssignments[student.id];
        if (!classId) {
          console.warn(`No class assigned for student ${student.name}`);
          continue;
        }

        console.log(`Creating student ${student.name} in class ${classId}`);

        try {
          // Generate email for student
          const studentEmail = `${student.name.toLowerCase().replace(/\s+/g, '.')}@iqra.com`;
          
          // Check if student already exists
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('name', student.name)
            .eq('class_id', classId)
            .single();

          if (existingStudent) {
            console.log(`Student ${student.name} already exists in class`);
            results.created.push({ 
              type: 'student_existing', 
              name: student.name,
              classId 
            });
            
            // Link to parent if parent was created
            if (parentUserId) {
              const { error: linkError } = await supabase
                .from('parent_student_links')
                .insert({
                  parent_user_id: parentUserId,
                  student_id: existingStudent.id,
                  phone_number: registration.phone
                });

              if (linkError && !linkError.message.includes('duplicate')) {
                console.error('Error linking student to parent:', linkError);
              }
            }
            continue;
          }

          // Create student record
          const { data: newStudent, error: studentError } = await supabase
            .from('students')
            .insert({
              name: student.name,
              first_name: student.name.split(' ')[0],
              last_name: student.name.split(' ').slice(1).join(' ') || '',
              email: studentEmail,
              class_id: classId,
              absence_level: 1,
              failure_level: 1,
              consecutive_absences: 0
            })
            .select()
            .single();

          if (studentError) {
            console.error(`Error creating student ${student.name}:`, studentError);
            results.errors.push({ 
              type: 'student', 
              name: student.name, 
              error: studentError.message 
            });
            continue;
          }

          // Link student to parent if parent was created
          if (parentUserId && newStudent) {
            const { error: linkError } = await supabase
              .from('parent_student_links')
              .insert({
                parent_user_id: parentUserId,
                student_id: newStudent.id,
                phone_number: registration.phone
              });

            if (linkError) {
              console.error('Error linking student to parent:', linkError);
              results.errors.push({ 
                type: 'student_link', 
                name: student.name, 
                error: linkError.message 
              });
            }
          }

          results.created.push({ 
            type: 'student', 
            name: student.name, 
            classId 
          });
          console.log(`Student ${student.name} created successfully`);

        } catch (error: any) {
          console.error(`Exception creating student ${student.name}:`, error);
          results.errors.push({ 
            type: 'student', 
            name: student.name, 
            error: error.message 
          });
        }
      }
    }

    // Update registration status to completed
    const { error: updateError } = await supabase
      .from('registrations')
      .update({ status: 'completed' })
      .eq('id', registrationId);

    if (updateError) {
      console.error('Error updating registration status:', updateError);
    }

    console.log('Processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed registration. Created ${results.created.length} accounts.`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in process-registration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
