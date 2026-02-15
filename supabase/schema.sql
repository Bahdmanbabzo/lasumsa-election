-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Linked to Supabase Auth)
-- This table extends the default auth.users table to store user details
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  matric_number TEXT,
  department TEXT,
  role TEXT DEFAULT 'voter' CHECK (role IN ('admin', 'voter')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. ELECTIONS
CREATE TABLE public.elections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id),
  allow_results_view BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. POSITIONS
CREATE TABLE public.positions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_votes INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. CANDIDATES
CREATE TABLE public.candidates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE NOT NULL,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. VOTERS (Election-specific registration)
CREATE TABLE public.voters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link to registered user
  matric_number TEXT NOT NULL,
  voting_code TEXT UNIQUE, -- Will be generated automatically
  has_voted BOOLEAN DEFAULT FALSE,
  voted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(election_id, matric_number)
);

-- 6. VOTES
CREATE TABLE public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES public.voters(id) ON DELETE CASCADE NOT NULL,
  cast_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(voter_id, position_id) -- Prevent double voting for same position
);

-- --- INDEXES ---
CREATE INDEX idx_voters_matric ON public.voters(matric_number);
CREATE INDEX idx_voters_election ON public.voters(election_id);
CREATE INDEX idx_votes_election ON public.votes(election_id);
CREATE INDEX idx_votes_candidate ON public.votes(candidate_id);
CREATE INDEX idx_votes_position ON public.votes(position_id);


-- --- ROW LEVEL SECURITY (RLS) ---
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Policies for PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for ELECTIONS
CREATE POLICY "Admins can do everything on elections" ON public.elections FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Everyone can view elections" ON public.elections FOR SELECT USING (true);

-- Policies for POSITIONS
CREATE POLICY "Admins can do everything on positions" ON public.positions FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Everyone can view positions" ON public.positions FOR SELECT USING (true);

-- Policies for CANDIDATES
CREATE POLICY "Admins can do everything on candidates" ON public.candidates FOR ALL USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Everyone can view candidates" ON public.candidates FOR SELECT USING (true);

-- Policies for VOTERS
CREATE POLICY "Admins can view all voters" ON public.voters FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
CREATE POLICY "Voters can view their own status" ON public.voters FOR SELECT USING (
  auth.uid() = user_id
);

-- Policies for VOTES
CREATE POLICY "Voters can insert their own vote" ON public.votes FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.voters WHERE id = voter_id)
);
CREATE POLICY "No one can update or delete votes" ON public.votes FOR UPDATE USING (false);
CREATE POLICY "No one can delete votes" ON public.votes FOR DELETE USING (false);
CREATE POLICY "Admins or public view depending on election settings" ON public.votes FOR SELECT USING (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') OR
  exists (select 1 from public.elections where id = election_id and allow_results_view = true)
);

-- --- FUNCTIONS & TRIGGERS ---

-- 1. Handle New User Signup -> Create Profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, matric_number, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'matric_number',
    COALESCE(new.raw_user_meta_data->>'role', 'voter')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Generate Unique Voting Code
-- This function generates a random 6-character alphanumeric code
CREATE OR REPLACE FUNCTION public.generate_voting_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  done BOOLEAN DEFAULT FALSE;
BEGIN
  -- Build a loop to ensure uniqueness
  WHILE NOT done LOOP
    -- Generate random 6-char string (uppercase + numbers)
    new_code := upper(substring(md5(random()::text), 1, 6));
    
    -- Check if it exists in the voters table
    PERFORM 1 FROM public.voters WHERE voting_code = new_code;
    
    -- If not found, we are good
    IF NOT FOUND THEN
      done := TRUE;
    END IF;
  END LOOP;

  NEW.voting_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_voting_code
  BEFORE INSERT ON public.voters
  FOR EACH ROW
  WHEN (NEW.voting_code IS NULL)
  EXECUTE PROCEDURE public.generate_voting_code();

