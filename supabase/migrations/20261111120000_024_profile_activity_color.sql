-- 024: the colour of the profile activity graph, chosen by the profile owner (primary blue, green, or black/white).

alter table public.profiles
  add column activity_color text not null default 'primary'
  check (activity_color in ('primary', 'green', 'mono'));

grant update (activity_color) on public.profiles to authenticated;
