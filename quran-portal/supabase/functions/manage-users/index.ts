
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { action, userId, email, role, ...otherParams } = await req.json()
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // List users with their roles
    if (action === 'listUsers') {
      // Get all auth users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        throw authError
      }
      
      if (!authUsers || !authUsers.users) {
        return new Response(
          JSON.stringify({ error: 'No users found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }
      
      // Get all user roles
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        
      if (roleError) {
        throw roleError
      }
      
      // Get all adult students
      const { data: adultStudents, error: adultError } = await supabase
        .from('adult_students')
        .select('id, email, phone_number')
        
      if (adultError) {
        console.error('Error fetching adult students:', adultError)
      }
      
      // Create a map of adult students by id for quick lookup
      const adultStudentsMap = new Map();
      if (adultStudents && adultStudents.length > 0) {
        adultStudents.forEach(student => {
          adultStudentsMap.set(student.id, student);
        });
      }
      
      // Create map of roles by user ID for quick lookup
      const roleMap = new Map()
      if (userRoles) {
        userRoles.forEach(userRole => {
          roleMap.set(userRole.user_id, userRole.role)
        })
      }
      
      // Format user data with roles
      const formattedUsers = authUsers.users.map(user => {
        // Check if user has a role
        const role = roleMap.get(user.id) || 'unknown'
        
        // Determine if this is an adult student by checking metadata or adult_students table
        const isAdultStudent = 
          (user.user_metadata?.is_adult_student === true) || 
          (role === 'student' && adultStudentsMap.has(user.id));
        
        // Get phone number from adult_students table if available
        const adultStudentInfo = adultStudentsMap.get(user.id);
        const phoneNumber = adultStudentInfo?.phone_number || user.user_metadata?.phone_number || null;
        
        // Extract name from user metadata
        const firstName = user.user_metadata?.firstName || user.user_metadata?.first_name || ''
        const lastName = user.user_metadata?.lastName || user.user_metadata?.last_name || ''
        
        return {
          id: user.id,
          email: user.email,
          role,
          is_adult_student: isAdultStudent,
          phone_number: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          created_at: user.created_at
        }
      })
      
      return new Response(
        JSON.stringify(formattedUsers),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // For actions that require a user ID
    if (['updateUserEmail', 'deleteUser', 'resetPassword'].includes(action) && !userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required for this action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Handle different actions
    switch (action) {
      case 'updateUserEmail':
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required for updateUserEmail action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }
        
        // Update email in Auth
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userId,
          { email }
        )
        
        if (updateError) throw updateError
        
        // Also update email in adult_students table if applicable
        const { error: adultUpdateError } = await supabase
          .from('adult_students')
          .update({ email })
          .eq('id', userId)
        
        if (adultUpdateError) {
          console.log('Note: No adult student record found to update email, or update failed')
        }
        
        return new Response(
          JSON.stringify({ message: 'Email updated successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      
      case 'deleteUser': {
        try {
          console.log('Starting deletion process for user:', userId);
          
          // Step 1: Delete parent-student links
          console.log('Deleting parent-student links...');
          const { error: linkError } = await supabase
            .from('parent_student_links')
            .delete()
            .eq('parent_user_id', userId);

          if (linkError) {
            console.error('Error deleting parent-student links:', linkError);
            throw new Error(`Failed to delete parent links: ${linkError.message}`);
          }

          // Step 2: Delete user role
          console.log('Deleting user role...');
          const { error: roleError } = await supabase
            .from('user_roles')
            .delete()
            .eq('user_id', userId);

          if (roleError) {
            console.error('Error deleting user role:', roleError);
            throw new Error(`Failed to delete user role: ${roleError.message}`);
          }

          // Step 3: Delete user subscription
          console.log('Deleting user subscription...');
          const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .delete()
            .eq('user_id', userId);

          if (subscriptionError) {
            console.error('Error deleting subscription:', subscriptionError);
            // Don't throw, just log - subscription might not exist
          }

          // Step 4: Delete from auth.users (this cascades to adult_students if they exist)
          console.log('Deleting user from auth...');
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

          if (deleteError) {
            console.error('Error deleting from auth:', deleteError);
            throw new Error(`Failed to delete user from auth: ${deleteError.message}`);
          }

          console.log('User deletion completed successfully');
          
          return new Response(
            JSON.stringify({ 
              message: 'User and all related data deleted successfully',
              deletedUserId: userId
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        } catch (error: any) {
          console.error('Error in deleteUser:', error);
          return new Response(
            JSON.stringify({ 
              error: error.message || 'Unknown error occurred',
              details: error.toString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
      }
      
      case 'resetPassword':
        // Reset user password by ID
        const { error: resetError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: otherParams.password }
        )
        
        if (resetError) throw resetError
        
        return new Response(
          JSON.stringify({ message: 'Password reset successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      
      case 'syncAdultStudents':
        // This action will sync adult students between auth and the adult_students table
        console.log('Starting adult student sync...')
        
        // Get all auth users with student role
        const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers()
        
        if (usersError) throw usersError
        
        // Get all user roles
        const { data: allRoles, error: allRolesError } = await supabase
          .from('user_roles')
          .select('*')
          
        if (allRolesError) throw allRolesError
        
        // Create map of roles by user ID
        const allRoleMap = new Map()
        if (allRoles) {
          allRoles.forEach(userRole => {
            allRoleMap.set(userRole.user_id, userRole.role)
          })
        }
        
        // Get current adult_students records
        const { data: existingAdultStudents, error: existingError } = await supabase
          .from('adult_students')
          .select('id, email')
          
        if (existingError) throw existingError
        
        // Create set of existing adult student IDs
        const existingAdultStudentIds = new Set()
        if (existingAdultStudents) {
          existingAdultStudents.forEach(student => {
            existingAdultStudentIds.add(student.id)
          })
        }
        
        // Find student users that should be adult students (based on metadata)
        const adultStudentsToSync = allUsers.users.filter(user => 
          allRoleMap.get(user.id) === 'student' && 
          user.user_metadata?.is_adult_student === true &&
          !existingAdultStudentIds.has(user.id)
        )
        
        console.log(`Found ${adultStudentsToSync.length} adult students to sync`)
        
        // For each adult student not in adult_students table, fetch their student record
        // and add them to adult_students table
        for (const user of adultStudentsToSync) {
          // Get student record
          const { data: studentRecord, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('id', user.id)
            .single()
            
          if (studentError) {
            console.error(`Error fetching student record for ${user.id}:`, studentError)
            continue
          }
          
          if (!studentRecord) {
            console.error(`No student record found for ${user.id}`)
            continue
          }
          
          // Insert into adult_students table
          const { error: insertError } = await supabase
            .from('adult_students')
            .insert({
              id: user.id,
              email: user.email,
              first_name: studentRecord.first_name || user.user_metadata?.firstName,
              last_name: studentRecord.last_name || user.user_metadata?.lastName,
              class_id: studentRecord.class_id,
              phone_number: user.user_metadata?.phone_number
            })
            
          if (insertError) {
            console.error(`Error inserting adult student record for ${user.id}:`, insertError)
          } else {
            console.log(`Successfully added adult student record for ${user.email}`)
          }
          
          // Check if notification preferences exist
          const { data: existingPrefs, error: prefError } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('parent_user_id', user.id)
            .maybeSingle()
            
          if (!existingPrefs && !prefError) {
            // Create notification preferences
            const { error: createPrefError } = await supabase
              .from('notification_preferences')
              .insert({
                parent_user_id: user.id,
                phone_number: user.user_metadata?.phone_number,
                lesson_pass: true,
                lesson_fail: true,
                homework_assigned: true
              })
              
            if (createPrefError) {
              console.error(`Error creating notification preferences for ${user.id}:`, createPrefError)
            }
          }
        }
        
        return new Response(
          JSON.stringify({ 
            message: `Adult student sync complete. Synchronized ${adultStudentsToSync.length} students.` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported action: ${action}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
  } catch (error) {
    console.error(`Error in manage-users function:`, error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
