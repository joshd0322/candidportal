-- Per-admin column visibility/order for Accounts and Leads list tables

begin;

create table if not exists public.admin_list_column_prefs (
  user_id uuid not null references auth.users (id) on delete cascade,
  list_key text not null,
  visible_columns text[] not null default '{}',
  column_order text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, list_key),
  constraint admin_list_column_prefs_list_key_check
    check (list_key in ('accounts', 'leads'))
);

drop trigger if exists set_admin_list_column_prefs_updated_at on public.admin_list_column_prefs;
create trigger set_admin_list_column_prefs_updated_at
before update on public.admin_list_column_prefs
for each row
execute function public.set_updated_at();

alter table public.admin_list_column_prefs enable row level security;

drop policy if exists "admin_list_column_prefs_owner_all" on public.admin_list_column_prefs;
create policy "admin_list_column_prefs_owner_all"
on public.admin_list_column_prefs for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.admin_list_column_prefs to authenticated;

commit;
