-- Políticas para Storage (storage.objects)
-- Ajuste os nomes dos buckets se necessário

-- Observação: policies em storage.objects assumem uso de metadata.user_id

-- Permitindo upload para bucket 'videos' somente por usuário autenticado cujo metadata.user_id = auth.uid()
CREATE POLICY IF NOT EXISTS "storage_upload_videos" ON storage.objects FOR INSERT
  USING (auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'videos' AND (metadata->>'user_id') = auth.uid());

-- Permitir leitura de objetos em 'videos' se is_public=true ou dono
CREATE POLICY IF NOT EXISTS "storage_select_videos" ON storage.objects FOR SELECT
  USING ((bucket_id = 'videos' AND ((metadata->>'is_public') = 'true' OR (metadata->>'user_id') = auth.uid())));

-- Permitir delete/update em 'videos' somente para o dono
CREATE POLICY IF NOT_EXISTS "storage_modify_videos" ON storage.objects FOR UPDATE, DELETE
  USING (bucket_id = 'videos' AND (metadata->>'user_id') = auth.uid());

-- Para 'thumbnails' e 'avatars' assumimos objetos públicos — se bucket for público, leitura é pública
-- Se quiser controlar via metadata, adicione políticas similares ao exemplo acima

-- Política para 'processing-temp' — somente uploads por usuário autenticado e limpeza por service role
CREATE POLICY IF NOT EXISTS "storage_upload_processing_temp" ON storage.objects FOR INSERT
  USING (auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'processing-temp' AND (metadata->>'user_id') = auth.uid());

-- Nota: As operações feitas com a `service_role` key ignoram RLS — scripts administrativos podem usar ela.
