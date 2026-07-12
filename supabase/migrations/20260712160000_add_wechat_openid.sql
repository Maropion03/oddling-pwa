alter table public.profiles add column wechat_openid text unique;
create index profiles_wechat_openid_idx on public.profiles (wechat_openid);
