
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Token verification error:', authError)
      throw new Error('Invalid token')
    }

    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !roleData || roleData.role !== 'admin') {
      console.error('User not authorized:', user.id)
      return new Response(
        JSON.stringify({ error: 'Not authorized. Admin access required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    const { email, password, role, firstName, lastName, parentId, classId, phoneNumber, isAdultStudent } = await req.json()
    console.log('Admin creating user with email:', email, 'and role:', role, 'isAdultStudent:', isAdultStudent)

    if (!email || !password || !role || !firstName || !lastName) {
      console.error('Missing required fields:', { email: !!email, password: !!password, role: !!role, firstName: !!firstName, lastName: !!lastName })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // For regular student role (not adult student), verify parent exists
    if (role === 'student' && !isAdultStudent && !parentId) {
      console.error('Missing parent ID for student account')
      return new Response(
        JSON.stringify({ error: 'Parent ID is required for student accounts' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if user already exists before trying to create
    const { data: existingUser } = await adminClient.rpc('get_user_by_email', { p_email: email })
    
    if (existingUser && existingUser.length > 0) {
      console.log('User with email already exists:', email)
      return new Response(
        JSON.stringify({ 
          error: 'A user with this email already exists',
          code: 'email_exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    console.log('No existing user found, proceeding with creation for:', email)

    // Create the user metadata - for adult students, mark them specifically
    const userMetadata = {
      firstName,
      lastName
    };
    
    if (isAdultStudent) {
      // @ts-ignore - add is_adult_student to user metadata
      userMetadata.is_adult_student = true;
    }

    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata
    })

    if (createError) {
      console.error('Error creating user:', createError)
      // Check if error is due to email existence
      if (createError.message?.toLowerCase().includes('email already exists') || 
          createError.name === 'AuthApiError' && createError.status === 422) {
        return new Response(
          JSON.stringify({ 
            error: 'A user with this email already exists',
            code: 'email_exists'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        )
      }
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user', 
          details: createError 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!userData.user) {
      console.error('User creation failed - no user data returned')
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create user role - crucial fix: use the actual role parameter for parents
    const actualRole = isAdultStudent ? 'student' : role;
    const { error: roleInsertError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: actualRole
      })

    if (roleInsertError) {
      console.error('Error creating user role:', roleInsertError)
      await adminClient.auth.admin.deleteUser(userData.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create user role', details: roleInsertError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // If creating a student (regular or adult)
    if (role === 'student') {
      // Create student record
      const studentRecord = {
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        email: email,
        class_id: classId || null
      }
      
      const { data: studentData, error: studentError } = await adminClient
        .from('students')
        .insert(studentRecord)
        .select()
        .single()

      if (studentError) {
        console.error('Error creating student record:', studentError)
        await adminClient.auth.admin.deleteUser(userData.user.id)
        return new Response(
          JSON.stringify({ error: 'Failed to create student record', details: studentError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // For adult students, add them to the adult_students table immediately
      if (isAdultStudent) {
        let formattedPhone = phoneNumber?.trim();
        if (formattedPhone && !formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        
        console.log('Creating adult student record for:', email, 'with phone:', formattedPhone);
        
        // Add to adult_students table
        const { error: adultError } = await adminClient
          .from('adult_students')
          .insert({
            id: studentData.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone_number: formattedPhone,
            class_id: classId || null
          })
            
        if (adultError) {
          console.error('Error creating adult student record:', adultError)
          // Don't fail the whole operation if just the adult student record fails
          // The user is still created and can be managed later
        } else {
          console.log('Successfully created adult_students record for:', email);
        }

        // Create notification preferences for adult student without phone number
        // Phone number is stored in adult_students table
        const { error: prefError } = await adminClient
          .from('notification_preferences')
          .insert({
            parent_user_id: userData.user.id,
            phone_number: null, // Phone number stored in adult_students table
            lesson_pass: true,
            lesson_fail: true,
            homework_assigned: true
          })
        
        if (prefError) {
          console.error('Error creating notification preferences:', prefError)
        }
      } else if (parentId) {
        // For regular students, create parent-student link
        const { error: linkError } = await adminClient
          .from('parent_student_links')
          .insert({
            parent_user_id: parentId,
            student_id: studentData.id
          })

        if (linkError) {
          console.error('Error creating parent-student link:', linkError)
          await adminClient.auth.admin.deleteUser(userData.user.id)
          return new Response(
            JSON.stringify({ error: 'Failed to link student to parent', details: linkError }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
      }
    }

    // If creating a parent, create notification preferences and phone number record
    if (role === 'parent') {
      // Create notification preferences
      const { error: prefError } = await adminClient
        .from('notification_preferences')
        .insert({
          parent_user_id: userData.user.id,
          phone_number: null, // Phone numbers managed in parent_student_links
          lesson_pass: true,
          lesson_fail: true,
          homework_assigned: true
        });
        
      if (prefError) {
        console.error('Error creating notification preferences:', prefError);
        // We don't want to fail the whole operation if just the preferences fail
        // so we log the error but continue
      }

      // If phone number provided, create a phone-only record in parent_student_links
      if (phoneNumber) {
        let formattedPhone = phoneNumber.trim();
        if (formattedPhone && !formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }

        const { error: phoneError } = await adminClient
          .from('parent_student_links')
          .insert({
            parent_user_id: userData.user.id,
            student_id: null, // No student linked initially
            phone_number: formattedPhone
          });

        if (phoneError) {
          console.error('Error creating parent phone record:', phoneError);
          // Log error but don't fail the operation
        }
      }
    }

    console.log('User and role created successfully:', userData.user.id)
    return new Response(
      JSON.stringify({ 
        user: userData.user,
        message: 'User created successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in create-user-with-role:', error)
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred',
        details: error.message || error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
