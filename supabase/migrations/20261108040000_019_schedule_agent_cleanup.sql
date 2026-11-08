-- Runs cleanup_agent_data() every day at 03:17 UTC.
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'cleanup-agent-data',
  '17 3 * * *',
  $$select public.cleanup_agent_data()$$
);
