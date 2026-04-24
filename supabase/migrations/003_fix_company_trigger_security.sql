-- Fix handle_new_user: read 'name' key from metadata (signUp stores data: { name }),
-- not 'full_name' which was never populated.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name');
  RETURN NEW;
END;
$$;

-- Fix handle_new_company trigger: add SECURITY DEFINER so it can bypass RLS
-- when auto-inserting the owner row into company_members.
-- Without it, the INSERT policy's EXISTS check on companies fails (chicken-and-egg:
-- user can't see the company row because they're not yet a member).
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$;
