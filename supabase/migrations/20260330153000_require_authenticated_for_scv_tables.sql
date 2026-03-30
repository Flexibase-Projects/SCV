-- =====================================================
-- SEGURANCA: exigir usuario autenticado nas tabelas operacionais do SCV
-- Modelo interno preservado: qualquer usuario autenticado pode operar o sistema
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

DO $$
DECLARE
  target_table text;
  existing_policy record;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'controle_entregas',
    'abastecimentos',
    'manutencoes',
    'veiculos',
    'motoristas',
    'montadores',
    'tipos_servico_montagem',
    'acertos_viagem',
    'acerto_viagem_entregas',
    'acerto_viagem_abastecimentos',
    'acerto_viagem_abastecimentos_requisicao'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = target_table
        AND c.relkind = 'r'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', target_table);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', target_table);

      FOR existing_policy IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = target_table
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', existing_policy.policyname, target_table);
      END LOOP;

      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        'authenticated_all_' || target_table,
        target_table
      );
    END IF;
  END LOOP;
END
$$;
