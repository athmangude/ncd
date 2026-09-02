-- 004_pg_cron.sql
-- Enable pg_cron and schedule hourly AI insight generation

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'generate-hourly-insights',
  '0 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-ai-insights',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{"batch": true}'::jsonb
    );
  $$
);
