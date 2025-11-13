-- RBAC definitions for INT Smart Triage AI 2.0
-- This script creates reusable role and permission metadata for multi-tenant enforcement.

create schema if not exists access_control;

grant usage on schema access_control to authenticated;
grant usage on schema access_control to service_role;

create table if not exists access_control.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  is_default boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists access_control.permissions (
  key text primary key,
  description text not null
);

create table if not exists access_control.role_permissions (
  role_id uuid not null references access_control.roles(id) on delete cascade,
  permission_key text not null references access_control.permissions(key) on delete cascade,
  constraint role_permissions_pkey primary key (role_id, permission_key)
);

create table if not exists access_control.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role_id uuid not null references access_control.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  constraint user_roles_pkey primary key (user_id, organization_id, role_id)
);

alter table access_control.user_roles enable row level security;

create index if not exists user_roles_user_org_idx
  on access_control.user_roles (user_id, organization_id);

create index if not exists role_permissions_permission_idx
  on access_control.role_permissions (permission_key);

drop policy if exists "Users can view their role assignments" on access_control.user_roles;
create policy "Users can view their role assignments"
  on access_control.user_roles for select
  to authenticated
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
    )
  );

drop policy if exists "Admins can manage organization roles" on access_control.user_roles;
create policy "Admins can manage organization roles"
  on access_control.user_roles for all
  to authenticated
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid() and role in ('admin', 'manager')
    )
  );

insert into access_control.permissions (key, description) values
  ('tickets.read', 'Read ticket data'),
  ('tickets.manage', 'Create and update ticket data'),
  ('reports.read', 'View operational and compliance reports'),
  ('reports.manage', 'Create and update reporting resources'),
  ('users.manage', 'Manage organization users and roles'),
  ('audit_logs.read', 'View audit logs for an organization'),
  ('audit_logs.export', 'Export audit logs for compliance workflows')
on conflict (key) do update set description = excluded.description;

insert into access_control.roles (key, name, description, is_default) values
  ('admin', 'Administrator', 'Full administrative control for an organization', false),
  ('manager', 'Manager', 'Manage teams, tickets, and reports', false),
  ('csr', 'Customer Success Rep', 'Standard operational access to tickets', true),
  ('auditor', 'Auditor', 'Read-only access to audit logs and reports', false)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  is_default = excluded.is_default;

insert into access_control.role_permissions (role_id, permission_key)
select r.id, p.key
from access_control.roles r
join access_control.permissions p on true
where
  r.key = 'admin'
  or (r.key = 'manager' and p.key in ('tickets.read', 'tickets.manage', 'reports.read', 'reports.manage', 'audit_logs.read'))
  or (r.key = 'csr' and p.key in ('tickets.read'))
  or (r.key = 'auditor' and p.key in ('reports.read', 'audit_logs.read'))
on conflict (role_id, permission_key) do nothing;

insert into access_control.user_roles (user_id, organization_id, role_id)
select up.id, up.organization_id, r.id
from user_profiles up
join access_control.roles r on r.key = up.role
where up.organization_id is not null
on conflict do nothing;

drop policy if exists "Users can view audit logs in their organization" on audit_logs;

drop policy if exists "Audit log access via RBAC" on audit_logs;
create policy "Audit log access via RBAC"
  on audit_logs for select
  to authenticated
  using (
    organization_id in (
      select organization_id from user_profiles where id = auth.uid()
    )
    and access_control.has_permission('audit_logs.read', organization_id)
  );

create or replace function access_control.has_permission(required_permission text, target_org uuid default null)
returns boolean
language sql
security definer
set search_path = access_control, public
as $$
  select exists (
    select 1
    from access_control.user_roles ur
    join access_control.role_permissions rp on rp.role_id = ur.role_id
    where ur.user_id = auth.uid()
      and rp.permission_key = required_permission
      and (target_org is null or ur.organization_id = target_org)
  );
$$;

grant execute on function access_control.has_permission(text, uuid) to authenticated;

drop function if exists access_control.require_permission(text, uuid);
create function access_control.require_permission(required_permission text, target_org uuid default null)
returns void
language plpgsql
security definer
set search_path = access_control, public
as $$
begin
  if not access_control.has_permission(required_permission, target_org) then
    raise exception 'insufficient_privilege';
  end if;
end;
$$;

grant execute on function access_control.require_permission(text, uuid) to authenticated;
