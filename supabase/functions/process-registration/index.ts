import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Processing a registration must leave nothing for an admin to finish by hand.
 *
 *   parent registration - create the parent account, create a student row per
 *                         child, and link every child to that parent.
 *   adult  registration - create a parent account holding the phone number,
 *                         create the adult's own student login, link the two.
 *
 * This previously reported success even when linking failed, so a registration
 * could show "Processed" while the children had no contactable parent - which
 * is exactly what happened to the Farah children. It now refuses to mark a
 * registration completed unless every child is actually linked.
 */

/** Twilio needs E.164. Registrations often arrive as bare 10-digit numbers. */
const normalizePhone = (raw?: string | null): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (raw.trim().startsWith('+') && digits.length >= 8) return '+' + digits;
  return null;
};

const randomPassword = () => Math.random().toString(36).slice(-12) + 'Aa1!';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { registrationId, classAssignments } = await req.json();
    if (!registrationId || !classAssignments) {
      return json({ error: 'Missing registrationId or classAssignments' }, 400);
    }

    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('*, registration_students ( id, name, age )')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      return json({ error: 'Registration not found' }, 404);
    }

    const students = registration.registration_students || [];
    const email = String(registration.email || '').toLowerCase().trim();
    const phone = normalizePhone(registration.phone);
    const isAdult = registration.registration_type === 'adult';

    const created: any[] = [];
    const errors: any[] = [];

    if (!phone) {
      errors.push({
        type: 'phone',
        error: 'Unusable phone number: "' + registration.phone + '"',
      });
    }

    // ---- 1. Resolve the parent account -------------------------------------
    // Look the account up first, and if creation still collides because it
    // already exists, look it up again rather than giving up. Leaving
    // parentUserId null is what previously produced unlinked children.
    const findParent = async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc('get_user_by_email', { p_email: email });
      if (error) console.error('get_user_by_email failed:', error.message);
      return data && data.length > 0 ? data[0].id : null;
    };

    let parentUserId = await findParent();

    if (!parentUserId) {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true,
        user_metadata: {
          first_name: registration.parent_name?.split(' ')[0] || '',
          last_name: registration.parent_name?.split(' ').slice(1).join(' ') || '',
        },
      });

      if (authError) {
        // Almost always "already registered" - a lookup that missed. Retry it.
        parentUserId = await findParent();
        if (!parentUserId) {
          errors.push({ type: 'parent', error: authError.message });
        }
      } else {
        parentUserId = authUser.user.id;
        created.push({ type: 'parent', email });
      }
    }

    if (parentUserId) {
      await supabase
        .from('user_roles')
        .upsert({ user_id: parentUserId, role: 'parent' }, { onConflict: 'user_id, role' });

      if (phone) {
        await supabase.from('notification_preferences').upsert({
          parent_user_id: parentUserId,
          phone_number: phone,
          homework_assigned: true,
          lesson_pass: true,
          lesson_fail: true,
        }, { onConflict: 'parent_user_id' });
      }
    }

    // ---- 2. Each child: student row, optional login, and the link ----------
    for (const student of students) {
      const name = String(student.name || '').trim();
      const classId = classAssignments[student.id];

      if (!classId) {
        errors.push({ type: 'class', name, error: 'No class assigned' });
        continue;
      }

      try {
        // Reuse an existing row rather than minting another duplicate.
        // Compared on a normalised name: stored names carry stray whitespace and
        // inconsistent capitalisation ("Semira ahmed " vs "Semira Ahmed"), and an
        // exact match would miss them and create a second row for the same child.
        const norm = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ');
        const { data: classmates } = await supabase
          .from('students')
          .select('id, name')
          .eq('class_id', classId);

        const match = (classmates ?? []).find((c: any) => norm(c.name ?? '') === norm(name));
        let studentId: string | null = match ? match.id : null;
        let studentEmail = name.toLowerCase().replace(/\s+/g, '.') + '@iqra.com';

        if (!studentId) {
          // An adult student also needs their own login to sign in with.
          if (isAdult) {
            const suffix = Math.random().toString(36).substring(2, 8);
            studentEmail =
              name.toLowerCase().replace(/\s+/g, '.') + '.' + suffix + '@iqra.com';

            const { data: studentAuth, error: studentAuthError } =
              await supabase.auth.admin.createUser({
                email: studentEmail,
                password: randomPassword(),
                email_confirm: true,
                user_metadata: { name },
              });

            if (studentAuthError) {
              errors.push({ type: 'student_auth', name, error: studentAuthError.message });
            } else {
              await supabase
                .from('user_roles')
                .insert({ user_id: studentAuth.user.id, role: 'student' });
            }
          }

          const { data: newStudent, error: studentError } = await supabase
            .from('students')
            .insert({
              name,
              first_name: name.split(' ')[0],
              last_name: name.split(' ').slice(1).join(' ') || '',
              email: studentEmail,
              class_id: classId,
              absence_level: 1,
              failure_level: 1,
              consecutive_absences: 0,
            })
            .select('id')
            .single();

          if (studentError || !newStudent) {
            errors.push({
              type: 'student',
              name,
              error: studentError?.message ?? 'insert failed',
            });
            continue;
          }
          studentId = newStudent.id;
          created.push({ type: 'student', name, classId });
        } else {
          created.push({ type: 'student_existing', name, classId });
        }

        // ---- the link. This is the step that must not fail quietly. --------
        if (!parentUserId) {
          errors.push({ type: 'link', name, error: 'No parent account to link to' });
          continue;
        }

        const { error: linkError } = await supabase
          .from('parent_student_links')
          .upsert(
            { parent_user_id: parentUserId, student_id: studentId, phone_number: phone },
            { onConflict: 'parent_user_id, student_id' },
          );

        if (linkError) {
          errors.push({ type: 'link', name, error: linkError.message });
        } else {
          created.push({ type: 'link', name });
        }
      } catch (error: any) {
        errors.push({ type: 'student', name, error: error.message });
      }
    }

    // ---- 3. Only claim completion when every child is actually linked ------
    const linked = created.filter((c) => c.type === 'link').length;
    const complete = errors.length === 0 && linked === students.length;

    if (complete) {
      await supabase
        .from('registrations')
        .update({ status: 'completed' })
        .eq('id', registrationId);
    }

    return json({
      success: complete,
      message: complete
        ? 'Processed. ' + linked + ' student' + (linked !== 1 ? 's' : '') +
          ' created and linked to ' + email + '.'
        : 'Incomplete: ' + linked + ' of ' + students.length +
          ' students linked, ' + errors.length + ' problem' +
          (errors.length !== 1 ? 's' : '') + '. See details.',
      results: { created, errors },
    }, complete ? 200 : 207);

  } catch (error: any) {
    console.error('process-registration failed:', error);
    return json({ error: error.message }, 500);
  }
});
