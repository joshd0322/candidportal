import { NextResponse } from 'next/server';
import { getMyRole } from '@/lib/auth/roles';
import {
  isAdminListKey,
  normalizeListColumnPrefs,
  type ListColumnPrefs,
} from '@/lib/admin-list-column-prefs';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function currentUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function listKeyFromRequest(request: Request): string | null {
  return new URL(request.url).searchParams.get('list');
}

export async function GET(request: Request) {
  if ((await getMyRole()) !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const listKey = listKeyFromRequest(request);
  if (!isAdminListKey(listKey)) {
    return NextResponse.json({ error: 'Invalid list key' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('admin_list_column_prefs')
    .select('visible_columns, column_order')
    .eq('user_id', userId)
    .eq('list_key', listKey)
    .maybeSingle();

  if (error && !/admin_list_column_prefs|does not exist|schema cache/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    prefs: normalizeListColumnPrefs(listKey, {
      visibleColumns: data?.visible_columns,
      columnOrder: data?.column_order,
    }),
  });
}

export async function PUT(request: Request) {
  if ((await getMyRole()) !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const listKey = listKeyFromRequest(request);
  if (!isAdminListKey(listKey)) {
    return NextResponse.json({ error: 'Invalid list key' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<ListColumnPrefs>;
  const prefs = normalizeListColumnPrefs(listKey, body);
  const admin = createSupabaseAdminClient();

  const { error } = await admin.from('admin_list_column_prefs').upsert(
    {
      user_id: userId,
      list_key: listKey,
      visible_columns: prefs.visibleColumns,
      column_order: prefs.columnOrder,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,list_key' },
  );

  if (error) {
    if (/admin_list_column_prefs|does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            'Column preferences table not set up. Run migration 0081_admin_list_column_prefs.sql.',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prefs });
}
