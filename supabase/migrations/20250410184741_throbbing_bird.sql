-- Add paid_date column to invoices table
ALTER TABLE invoices
ADD COLUMN paid_date timestamptz;

-- Create index for paid date
CREATE INDEX invoices_paid_date_idx ON invoices(paid_date);

-- Create function to update dashboard stats
CREATE OR REPLACE FUNCTION update_dashboard_stats()
RETURNS trigger AS $$
BEGIN
  -- Log the payment in activity_logs
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    INSERT INTO activity_logs (
      user_id,
      action,
      details
    ) VALUES (
      auth.uid(),
      'invoice_paid',
      jsonb_build_object(
        'invoice_number', NEW.invoice_number,
        'amount', NEW.amount,
        'paid_date', NEW.paid_date
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice status changes
CREATE TRIGGER invoice_status_change
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_stats();