
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Starting get-parent-users function")
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First get all users with parent role
    const { data: parentRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('user_id')
      .eq('role', 'parent')

    if (rolesError) {
      console.error("Error fetching parent roles:", rolesError.message)
      throw new Error(`Error fetching parent roles: ${rolesError.message}`)
    }

    if (!parentRoles || parentRoles.length === 0) {
      console.log("No parents found")
      return new Response(
        JSON.stringify([]), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Found ${parentRoles.length} parent users`)

    // Get complete user details for all parents
    const parentsPromise = parentRoles.map(async (role) => {
      try {
        // Get auth user details
        const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(
          role.user_id
        )
        
        if (userError || !user) {
          console.error(`Error fetching user data for ID ${role.user_id}:`, userError)
          return null
        }

        // Get parent-student links
        const { data: links, error: linksError } = await supabaseClient
          .from('parent_student_links')
          .select(`
            student_id,
            phone_number,
            students (
              id,
              name,
              email
            )
          `)
          .eq('parent_user_id', user.id)

        if (linksError) {
          console.error(`Error fetching student links for parent ${user.id}:`, linksError)
        }

        // Format student data
        const students = links && links.length > 0 
          ? links
              .filter(link => link.students) // Filter out null entries
              .map(link => ({
                id: link.student_id,
                name: link.students.name,
                email: link.students.email,
                isLinked: true
              }))
          : []

        // Get phone number if available from parent-student links
        const phoneNumber = links && links.length > 0 && links[0].phone_number 
          ? links[0].phone_number 
          : ''

        return {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.firstName || user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.lastName || user.user_metadata?.last_name || '',
          students: students,
          phone_number: phoneNumber,
          created_at: user.created_at,
          role: 'parent'
        }
      } catch (e) {
        console.error(`Error processing parent ${role.user_id}:`, e)
        return null
      }
    })

    // Resolve all promises and filter out nulls
    const parentResults = await Promise.all(parentsPromise)
    const validParents = parentResults.filter(Boolean)

    console.log(`Successfully fetched ${validParents.length} parents with ${validParents.reduce((sum, p) => sum + (p?.students?.length || 0), 0)} linked students`)

    return new Response(
      JSON.stringify(validParents),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in get-parent-users function:', error)
    
    return new Response(
      JSON.stringify({ error: String(error) }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
