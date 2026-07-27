grant select on public.person_current_balances
to authenticated;

grant select, insert, update, delete
on public.people
to authenticated;

grant select, insert, update, delete
on public.person_balance_entries
to authenticated;

notify pgrst, 'reload schema';