-- Migration v7: Fix topup_requests INSERT policy for service_role

-- Allow service_role to insert/update/delete topup_requests
drop policy if exists "Service role can manage topup requests" on topup_requests;

create policy "Service role can manage topup requests"
  on topup_requests for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Also allow authenticated users to insert their own topup requests
-- (needed so the service_role insert-on-behalf works via RETURNING)
drop policy if exists "Users can insert own topup requests" on topup_requests;

create policy "Users can insert own topup requests"
  on topup_requests for insert
  with check (auth.uid() = user_id);
