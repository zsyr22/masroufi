alter table public.person_balance_entries
drop constraint if exists
person_balance_entries_transaction_id_fkey;

alter table public.person_balance_entries
add constraint
person_balance_entries_transaction_id_fkey
foreign key (transaction_id)
references public.transactions(id)
on delete cascade;

notify pgrst, 'reload schema';