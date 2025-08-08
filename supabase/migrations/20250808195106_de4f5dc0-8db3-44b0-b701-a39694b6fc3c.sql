
-- 1) Habilitar RLS e políticas em funcionalidade
alter table public.funcionalidade enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'funcionalidade' and policyname = 'Allow read access to funcionalidade table'
  ) then
    create policy "Allow read access to funcionalidade table"
      on public.funcionalidade
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'funcionalidade' and policyname = 'Allow insert access to funcionalidade table'
  ) then
    create policy "Allow insert access to funcionalidade table"
      on public.funcionalidade
      for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'funcionalidade' and policyname = 'Allow update access to funcionalidade table'
  ) then
    create policy "Allow update access to funcionalidade table"
      on public.funcionalidade
      for update
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'funcionalidade' and policyname = 'Allow delete access to funcionalidade table'
  ) then
    create policy "Allow delete access to funcionalidade table"
      on public.funcionalidade
      for delete
      using (true);
  end if;
end $$;

-- 2) Habilitar RLS e políticas em perfil__funcionalidade
alter table public.perfil__funcionalidade enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'perfil__funcionalidade' and policyname = 'Allow read access to perfil__funcionalidade table'
  ) then
    create policy "Allow read access to perfil__funcionalidade table"
      on public.perfil__funcionalidade
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'perfil__funcionalidade' and policyname = 'Allow insert access to perfil__funcionalidade table'
  ) then
    create policy "Allow insert access to perfil__funcionalidade table"
      on public.perfil__funcionalidade
      for insert
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'perfil__funcionalidade' and policyname = 'Allow update access to perfil__funcionalidade table'
  ) then
    create policy "Allow update access to perfil__funcionalidade table"
      on public.perfil__funcionalidade
      for update
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'perfil__funcionalidade' and policyname = 'Allow delete access to perfil__funcionalidade table'
  ) then
    create policy "Allow delete access to perfil__funcionalidade table"
      on public.perfil__funcionalidade
      for delete
      using (true);
  end if;
end $$;

-- 3) Garantir unicidades para evitar duplicidades
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'unique_nom_funcionalidade'
  ) then
    alter table public.funcionalidade
      add constraint unique_nom_funcionalidade unique (nom_funcionalidade);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'unique_perfil_funcionalidade'
  ) then
    alter table public.perfil__funcionalidade
      add constraint unique_perfil_funcionalidade unique (id_perfil, id_funcionalidade);
  end if;
end $$;

-- 4) Popular funcionalidades básicas (id_usuario_criador = 1 é placeholder)
insert into public.funcionalidade (nom_funcionalidade, des_status, id_usuario_criador, dat_criacao, des_locked)
values
  ('Dashboard', 'A', 1, now(), 'D'),
  ('Entidades', 'A', 1, now(), 'D'),
  ('Tipos de Entidades', 'A', 1, now(), 'D'),
  ('Tipos de Resíduos', 'A', 1, now(), 'D'),
  ('Usuários', 'A', 1, now(), 'D'),
  ('Perfis', 'A', 1, now(), 'D'),
  ('Coletas', 'A', 1, now(), 'D')
on conflict (nom_funcionalidade) do nothing;
