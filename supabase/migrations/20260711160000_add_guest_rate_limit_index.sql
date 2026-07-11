create index if not exists guest_interactions_rate_limit_idx
  on public.guest_interactions (share_id, visitor_rate_hash, created_at desc);
