-- Hide email and phone from anonymous (unauthenticated) users.
-- Service-role clients (edge functions) still have full access.
REVOKE SELECT (email, phone) ON public.profiles FROM anon;
