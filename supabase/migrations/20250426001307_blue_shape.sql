/*
  # Create function to handle email sent updates

  1. Changes
    - Remove explicit transaction control
    - Update invoice status
    - Log activity
    - Create notification message
    
  2. Security
    - Function runs with SECURITY DEFINER
    - Accepts parameters for invoice details and user ID
*/

CREATE OR REPLACE FUNCTION handle_email_sent(
  p_invoice_id uuid,
  p_invoice_number text,
  p_customer_email text,
  p_invoice_status text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update invoice status
  UPDATE invoices
  SET 
    status = CASE WHEN p_invoice_status = 'estimate' THEN 'estimate' ELSE 'sent' END,
    updated_at = now()
  WHERE id = p_invoice_id;

  -- Log activity
  INSERT INTO activity_logs (
    user_id,
    action,
    details
  ) VALUES (
    p_user_id,
    p_invoice_status || '_sent',
    jsonb_build_object(
      'invoice_number', p_invoice_number,
      'customer_email', p_customer_email,
      'sent_at', now()
    )
  );

  -- Create notification
  INSERT INTO messages (
    user_id,
    type,
    subject,
    content,
    read
  ) VALUES (
    p_user_id,
    'email',
    p_invoice_status || ' sent',
    'Successfully sent ' || p_invoice_status || ' #' || p_invoice_number || ' to ' || p_customer_email,
    false
  );
END;
$$;