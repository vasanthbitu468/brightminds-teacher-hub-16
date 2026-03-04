import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateSessionToken(): Promise<{ token: string; hash: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  const hashArray = new Uint8Array(hashBuffer);
  const hash = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  return { token, hash };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { studentPublicId, pin } = await req.json();

    if (!studentPublicId || !pin) {
      return new Response(JSON.stringify({ error: 'Student ID and PIN are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!/^\d{6}$/.test(pin)) {
      return new Response(JSON.stringify({ error: 'PIN must be exactly 6 digits' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedId = studentPublicId.trim().toUpperCase();

    // Look up student
    const { data: student, error: lookupError } = await supabase
      .from('students')
      .select('id, name, pin_hash, pin_reset_required, access_token')
      .eq('student_public_id', trimmedId)
      .single();

    if (lookupError || !student) {
      return new Response(JSON.stringify({ error: 'Student not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!student.pin_hash) {
      return new Response(JSON.stringify({ error: 'PIN not set. Please create a PIN first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (student.pin_reset_required) {
      return new Response(JSON.stringify({ error: 'PIN reset required. Please create a new PIN.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify PIN - stored as "salt:hash"
    const [storedSalt, storedHash] = student.pin_hash.split(':');
    const computedHash = await hashPin(pin, storedSalt);

    if (computedHash !== storedHash) {
      return new Response(JSON.stringify({ error: 'Incorrect PIN' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure last_login_at and access_token are set on the student
    const updates: Record<string, unknown> = {
      last_login_at: new Date().toISOString(),
    };

    let accessToken = (student as any).access_token as string | null;

    // If access_token is missing for this student, generate and persist one
    if (!accessToken) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      accessToken = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      updates.access_token = accessToken;
    }

    await supabase
      .from('students')
      .update(updates)
      .eq('id', student.id);

    // Create session
    const { token, hash: tokenHash } = await generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabase
      .from('student_sessions')
      .insert({
        student_id: student.id,
        session_token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    const origin = req.headers.get('origin') || 'http://localhost:8081';
    const accessUrl = accessToken ? `${origin}/student-portal?token=${accessToken}` : null;

    return new Response(JSON.stringify({
      sessionToken: token,
      expiresAt: expiresAt.toISOString(),
      accessToken,
      accessUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in student-login-pin:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
