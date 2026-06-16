-- RPC stubs to avoid 404 from client REST calls. Run these in Supabase SQL Editor.

-- increment_user_likes_received(user_id uuid)
DROP FUNCTION IF EXISTS public.increment_user_likes_received(uuid);
CREATE FUNCTION public.increment_user_likes_received(user_id uuid)
RETURNS void AS $$
BEGIN
  -- stub: no-op or update a counter if you add the column later
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.increment_user_likes_received(uuid) TO authenticated;

-- decrement_user_likes_received(user_id uuid)
DROP FUNCTION IF EXISTS public.decrement_user_likes_received(uuid);
CREATE FUNCTION public.decrement_user_likes_received(user_id uuid)
RETURNS void AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.decrement_user_likes_received(uuid) TO authenticated;

-- increment_user_posts(user_id uuid)
DROP FUNCTION IF EXISTS public.increment_user_posts(uuid);
CREATE FUNCTION public.increment_user_posts(user_id uuid)
RETURNS void AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.increment_user_posts(uuid) TO authenticated;
