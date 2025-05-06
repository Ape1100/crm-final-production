/*
  # Enhanced Settings Tables

  1. New Tables
    - `user_roles` - Store role definitions
    - `team_members` - Store team member information
    - `activity_logs` - Track user actions
    - `subscription_plans` - Store subscription plan details

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
*/

-- User Roles
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    permissions jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Team Members
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS team_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES auth.users NOT NULL,
    user_id uuid REFERENCES auth.users,
    email text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role_id uuid REFERENCES user_roles NOT NULL,
    status text NOT NULL DEFAULT 'invited',
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Activity Logs
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    action text NOT NULL,
    details jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Subscription Plans
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS subscription_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users NOT NULL,
    plan text NOT NULL,
    features jsonb NOT NULL DEFAULT '{}',
    price numeric(10,2) NOT NULL,
    billing_cycle text NOT NULL,
    auto_renew boolean DEFAULT true,
    next_billing_date timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN NULL;
END $$;

-- Enable RLS
DO $$ BEGIN
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
  ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view roles" ON user_roles;
  CREATE POLICY "Users can view roles"
    ON user_roles FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their team members" ON team_members;
  CREATE POLICY "Users can manage their team members"
    ON team_members FOR ALL
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their activity logs" ON activity_logs;
  CREATE POLICY "Users can view their activity logs"
    ON activity_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can manage their subscription" ON subscription_plans;
  CREATE POLICY "Users can manage their subscription"
    ON subscription_plans FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Default Roles
DO $$ BEGIN
  INSERT INTO user_roles (name, permissions) VALUES
    ('Admin', '["all"]'),
    ('Accountant', '["invoices.view", "invoices.create", "invoices.edit", "expenses.view", "expenses.create", "expenses.edit"]'),
    ('Sales Rep', '["customers.view", "customers.create", "customers.edit", "invoices.create"]'),
    ('Warehouse Manager', '["inventory.view", "inventory.edit", "inventory.create"]')
  ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;