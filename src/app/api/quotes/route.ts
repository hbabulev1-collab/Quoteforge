import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quotes: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { client_id, client_name_snapshot, lead_time, contact, parts, grand_total } = body;

  if (!Array.isArray(parts) || parts.length === 0) {
    return NextResponse.json({ error: 'Parts array is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      user_id: user.id,
      client_id: client_id || null,
      client_name_snapshot: client_name_snapshot || null,
      lead_time: lead_time || null,
      contact: contact || null,
      parts,
      grand_total: grand_total || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ quote: data }, { status: 201 });
}
