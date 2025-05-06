/*
  # Add handle_email_sent function

  1. New Function
    - Creates a function to handle post-email-send operations
    - Updates invoice status
    - Creates activity log entry
    - Creates notification message
    
  2. Security
    - Function runs with SECURITY DEFINER to ensure proper permissions
*/

CREATE OR REPLACE FUNCTION handle_email_sent(invoice_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update invoice status
  UPDATE invoices
  SET status = 'sent',
      updated_at = now()
  WHERE id = invoice_id;

  -- Insert activity log
  INSERT INTO activity_logs (
    user_id,
    action,
    details
  ) VALUES (
    auth.uid(),
    'invoice_sent',
    jsonb_build_object(
      'invoice_id', invoice_id,
      'sent_at', now()
    )
  );

  -- No COMMIT, no BEGIN, no ROLLBACK. Supabase handles transactions automatically.
END;
$$;