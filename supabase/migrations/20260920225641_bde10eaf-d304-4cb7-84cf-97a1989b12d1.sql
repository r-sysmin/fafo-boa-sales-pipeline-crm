ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_companies_is_demo ON public.companies (is_demo) WHERE is_demo;
CREATE INDEX IF NOT EXISTS idx_contacts_is_demo ON public.contacts (is_demo) WHERE is_demo;
CREATE INDEX IF NOT EXISTS idx_deals_is_demo ON public.deals (is_demo) WHERE is_demo;
CREATE INDEX IF NOT EXISTS idx_activities_is_demo ON public.activities (is_demo) WHERE is_demo;
CREATE INDEX IF NOT EXISTS idx_tasks_is_demo ON public.tasks (is_demo) WHERE is_demo;