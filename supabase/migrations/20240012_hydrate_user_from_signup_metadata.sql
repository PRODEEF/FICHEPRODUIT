-- Hydrate public.users depuis raw_user_meta_data au signup (website_url, pending_auto_analyze).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_website text;
  meta_pending text;
BEGIN
  meta_website := NULLIF(TRIM(NEW.raw_user_meta_data->>'website_url'), '');
  meta_pending := NEW.raw_user_meta_data->>'pending_auto_analyze';

  INSERT INTO public.users (id, display_name, website_url, pending_auto_analyze)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    ),
    meta_website,
    CASE
      WHEN meta_pending IS NULL THEN false
      WHEN meta_pending IN ('true', 't', '1', 'yes') THEN true
      ELSE false
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.users.display_name),
    website_url = COALESCE(EXCLUDED.website_url, public.users.website_url),
    pending_auto_analyze = COALESCE(EXCLUDED.pending_auto_analyze, public.users.pending_auto_analyze);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_auth_user failed for auth.users.id=%: % %', NEW.id, SQLERRM, SQLSTATE;
    RAISE;
END;
$$;
