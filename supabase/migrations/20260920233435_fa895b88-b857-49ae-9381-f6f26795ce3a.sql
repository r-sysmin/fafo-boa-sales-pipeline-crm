-- 1. Tighten SELECT visibility on shared CRM tables to owner / team / admin
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
CREATE POLICY "Owner, team or admin can view companies"
ON public.companies FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_team_member(auth.uid(), created_by)
);

DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
CREATE POLICY "Owner, team or admin can view contacts"
ON public.contacts FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_team_member(auth.uid(), created_by)
);

DROP POLICY IF EXISTS "Authenticated users can view deals" ON public.deals;
CREATE POLICY "Owner, team or admin can view deals"
ON public.deals FOR SELECT TO authenticated
USING (
  auth.uid() = owner_id
  OR auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.is_team_member(auth.uid(), owner_id)
);

DROP POLICY IF EXISTS "Authenticated users can view pipelines" ON public.pipelines;
CREATE POLICY "Owner, team or admin can view pipelines"
ON public.pipelines FOR SELECT TO authenticated
USING (
  auth.uid() = created_by
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
  OR public.is_team_member(auth.uid(), created_by)
);

DROP POLICY IF EXISTS "Authenticated users can view stages" ON public.pipeline_stages;
CREATE POLICY "Stages visible with their pipeline"
ON public.pipeline_stages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pipelines p
    WHERE p.id = pipeline_stages.pipeline_id
      AND (
        p.created_by = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'manager')
        OR public.is_team_member(auth.uid(), p.created_by)
      )
  )
);

-- 2. seed_default_pipeline must derive the acting user from the session, never from its argument
CREATE OR REPLACE FUNCTION public.seed_default_pipeline(p_user_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_pipeline_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.pipelines (name, created_by)
  VALUES ('Sales Pipeline', v_user_id)
  RETURNING id INTO v_pipeline_id;

  INSERT INTO public.pipeline_stages (pipeline_id, name, color, position) VALUES
    (v_pipeline_id, 'Prospect', '#3b82f6', 0),
    (v_pipeline_id, 'Qualified', '#8b5cf6', 1),
    (v_pipeline_id, 'Proposal', '#f97316', 2),
    (v_pipeline_id, 'Negotiation', '#eab308', 3),
    (v_pipeline_id, 'Won', '#22c55e', 4),
    (v_pipeline_id, 'Lost', '#ef4444', 5);

  RETURN v_pipeline_id;
END;
$function$;

-- 3. Lock down execution of SECURITY DEFINER routines
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_deal_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.seed_default_pipeline(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_default_pipeline(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated;