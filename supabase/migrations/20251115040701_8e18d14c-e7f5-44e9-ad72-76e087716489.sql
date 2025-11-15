-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create users profile table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name VARCHAR(255),
  role app_role DEFAULT 'user',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX users_email_idx ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX users_role_idx ON public.users(role);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create blocks table
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  code VARCHAR(32),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX blocks_name_idx ON public.blocks(name);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view blocks" ON public.blocks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage blocks" ON public.blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create laboratories table
CREATE TABLE public.laboratories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES public.blocks(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(120) NOT NULL,
  capacity INTEGER,
  external_identifier VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX laboratories_block_id_idx ON public.laboratories(block_id);
CREATE INDEX laboratories_name_idx ON public.laboratories(name);

ALTER TABLE public.laboratories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view laboratories" ON public.laboratories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage laboratories" ON public.laboratories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_laboratories_updated_at
  BEFORE UPDATE ON public.laboratories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view shifts" ON public.shifts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage shifts" ON public.shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create disciplines table
CREATE TABLE public.disciplines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  credits INTEGER,
  active BOOLEAN DEFAULT true NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX disciplines_active_idx ON public.disciplines(active);
CREATE INDEX disciplines_search_idx ON public.disciplines USING GIN(to_tsvector('portuguese', coalesce(name, '') || ' ' || coalesce(code, '')));

ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view disciplines" ON public.disciplines
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage disciplines" ON public.disciplines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_disciplines_updated_at
  BEFORE UPDATE ON public.disciplines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create patterns table
CREATE TABLE public.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE CASCADE NOT NULL,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  start_slot INTEGER NOT NULL,
  duration_slots INTEGER DEFAULT 1 NOT NULL,
  label VARCHAR(120),
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX patterns_laboratory_idx ON public.patterns(laboratory_id, weekday, start_slot);

ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view patterns" ON public.patterns
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage patterns" ON public.patterns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_patterns_updated_at
  BEFORE UPDATE ON public.patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create fixed_reservations table
CREATE TABLE public.fixed_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.users(id) NOT NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE NOT NULL,
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE CASCADE NOT NULL,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  start_slot INTEGER NOT NULL,
  duration_slots INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('AULA', 'PROJETO', 'MANUTENCAO')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  recurrence_rule JSONB,
  occurrences_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX fixed_reservations_created_by_idx ON public.fixed_reservations(created_by);
CREATE INDEX fixed_reservations_laboratory_dates_idx ON public.fixed_reservations(laboratory_id, start_date, end_date);

ALTER TABLE public.fixed_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reservations" ON public.fixed_reservations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage reservations" ON public.fixed_reservations
  FOR ALL USING (true);

CREATE TRIGGER update_fixed_reservations_updated_at
  BEFORE UPDATE ON public.fixed_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create reservation_occurrences table
CREATE TABLE public.reservation_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.fixed_reservations(id) ON DELETE CASCADE,
  laboratory_id UUID REFERENCES public.laboratories(id) ON DELETE CASCADE NOT NULL,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_slot INTEGER NOT NULL,
  duration_slots INTEGER NOT NULL,
  discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('AULA', 'PROJETO', 'MANUTENCAO')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(laboratory_id, date, start_slot)
);

CREATE INDEX reservation_occurrences_laboratory_date_idx ON public.reservation_occurrences(laboratory_id, date);
CREATE INDEX reservation_occurrences_laboratory_date_slot_idx ON public.reservation_occurrences(laboratory_id, date, start_slot);

ALTER TABLE public.reservation_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view occurrences" ON public.reservation_occurrences
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage occurrences" ON public.reservation_occurrences
  FOR ALL USING (true);

CREATE TRIGGER update_reservation_occurrences_updated_at
  BEFORE UPDATE ON public.reservation_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create conflict check function
CREATE OR REPLACE FUNCTION public.check_reservation_conflict(
  lab_id UUID,
  check_date DATE,
  check_start_slot INTEGER,
  check_duration INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  conflict_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.reservation_occurrences
    WHERE laboratory_id = lab_id
      AND date = check_date
      AND (
        -- Check if any slot overlaps
        (start_slot <= check_start_slot AND start_slot + duration_slots > check_start_slot)
        OR
        (check_start_slot <= start_slot AND check_start_slot + check_duration > start_slot)
      )
  ) INTO conflict_exists;
  
  RETURN conflict_exists;
END;
$$;

-- Create audit table
CREATE TABLE public.reservation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name VARCHAR(50) NOT NULL,
  row_data JSONB NOT NULL,
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX reservation_audit_created_at_idx ON public.reservation_audit(created_at);

ALTER TABLE public.reservation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.reservation_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create audit trigger functions
CREATE OR REPLACE FUNCTION public.audit_reservation_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  user_id := COALESCE(current_setting('app.current_user', true)::UUID, auth.uid());
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.reservation_audit (event_type, table_name, row_data, performed_by)
    VALUES (TG_OP, TG_TABLE_NAME, to_jsonb(OLD), user_id);
    RETURN OLD;
  ELSE
    INSERT INTO public.reservation_audit (event_type, table_name, row_data, performed_by)
    VALUES (TG_OP, TG_TABLE_NAME, to_jsonb(NEW), user_id);
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER audit_fixed_reservations
  AFTER INSERT OR UPDATE OR DELETE ON public.fixed_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_reservation_changes();

CREATE TRIGGER audit_reservation_occurrences
  AFTER INSERT OR UPDATE OR DELETE ON public.reservation_occurrences
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_reservation_changes();

-- Create app settings table
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view settings" ON public.app_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage settings" ON public.app_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('max_occurrences', '{"value": 200}', 'Maximum number of reservation occurrences allowed'),
  ('week_display_days', '{"value": 7}', 'Number of days to display in week view');

-- Insert default shifts
INSERT INTO public.shifts (name, start_time, end_time) VALUES
  ('MANHÃ', '08:00', '12:00'),
  ('TARDE', '13:00', '17:00'),
  ('NOITE', '18:00', '22:00');