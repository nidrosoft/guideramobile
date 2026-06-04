-- Schedule journeys-enrich-batch (spec §10.3). Mirrors the existing cron pattern
-- (anon bearer + x-cron-secret; the function enforces requireCronOrServiceAuth).

select cron.schedule(
  'journeys-enrich-pregenerate-daily',
  '15 4 * * *',
  $$
  select net.http_post(
    url := 'https://pkydmdygctojtfzbqcud.supabase.co/functions/v1/journeys-enrich-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreWRtZHlnY3RvanRmemJxY3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjQyNzUsImV4cCI6MjA4MjY0MDI3NX0.mnUr0Iv2IYGvQPAFg5WCeMiQB_cvWcSLvK__bLBpPeU',
      'x-cron-secret', '3c3f60d9f93ef7683b73aa673a4b8788a0bf26ba69ae233549af36f1cc173bbb'
    ),
    body := '{"mode":"pregenerate"}'::jsonb
  );
  $$
);

select cron.schedule(
  'journeys-enrich-refresh-weekly',
  '45 4 * * 0',
  $$
  select net.http_post(
    url := 'https://pkydmdygctojtfzbqcud.supabase.co/functions/v1/journeys-enrich-batch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreWRtZHlnY3RvanRmemJxY3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwNjQyNzUsImV4cCI6MjA4MjY0MDI3NX0.mnUr0Iv2IYGvQPAFg5WCeMiQB_cvWcSLvK__bLBpPeU',
      'x-cron-secret', '3c3f60d9f93ef7683b73aa673a4b8788a0bf26ba69ae233549af36f1cc173bbb'
    ),
    body := '{"mode":"refresh"}'::jsonb
  );
  $$
);
