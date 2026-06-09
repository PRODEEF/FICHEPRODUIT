-- Débit FIFO atomique et remboursement pour les exports (évite les courses concurrentes).

CREATE OR REPLACE FUNCTION public.debit_credits_fifo(
  p_user_id UUID,
  p_amount INTEGER,
  p_metadata JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_remaining INTEGER;
  v_lot RECORD;
  v_take INTEGER;
  v_now TIMESTAMPTZ := now();
  v_available INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN;
  END IF;

  v_remaining := p_amount;

  -- Verrouille les lots actifs de l'utilisateur avant lecture et débit.
  PERFORM 1
  FROM public.credit_lots
  WHERE user_id = p_user_id
    AND amount_remaining > 0
    AND (expires_at IS NULL OR expires_at > v_now)
  FOR UPDATE;

  SELECT COALESCE(SUM(amount_remaining), 0)
  INTO v_available
  FROM public.credit_lots
  WHERE user_id = p_user_id
    AND amount_remaining > 0
    AND (expires_at IS NULL OR expires_at > v_now);

  IF v_available < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS'
      USING ERRCODE = 'P0001',
            DETAIL = v_available::TEXT;
  END IF;

  FOR v_lot IN
    SELECT id, amount_remaining
    FROM public.credit_lots
    WHERE user_id = p_user_id
      AND amount_remaining > 0
      AND (expires_at IS NULL OR expires_at > v_now)
    ORDER BY expires_at NULLS LAST, created_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN v_remaining <= 0;

    v_take := LEAST(v_lot.amount_remaining, v_remaining);

    UPDATE public.credit_lots
    SET amount_remaining = amount_remaining - v_take
    WHERE id = v_lot.id;

    INSERT INTO public.credit_transactions (user_id, lot_id, delta, reason, metadata)
    VALUES (p_user_id, v_lot.id, -v_take, 'export', p_metadata);

    v_remaining := v_remaining - v_take;
  END LOOP;

  IF v_remaining > 0 THEN
    RAISE EXCEPTION 'DEBIT_INCOMPLETE'
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_export_debit(
  p_user_id UUID,
  p_export_attempt_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  FOR v_tx IN
    SELECT lot_id, delta
    FROM public.credit_transactions
    WHERE user_id = p_user_id
      AND reason = 'export'
      AND delta < 0
      AND metadata->>'export_attempt_id' = p_export_attempt_id
    ORDER BY created_at DESC
    FOR UPDATE
  LOOP
    UPDATE public.credit_lots
    SET amount_remaining = LEAST(amount_initial, amount_remaining + ABS(v_tx.delta))
    WHERE id = v_tx.lot_id;

    INSERT INTO public.credit_transactions (user_id, lot_id, delta, reason, metadata)
    VALUES (
      p_user_id,
      v_tx.lot_id,
      ABS(v_tx.delta),
      'refund',
      jsonb_build_object('export_attempt_id', p_export_attempt_id)
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.debit_credits_fifo(UUID, INTEGER, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_export_debit(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.debit_credits_fifo(UUID, INTEGER, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_export_debit(UUID, TEXT) TO service_role;
