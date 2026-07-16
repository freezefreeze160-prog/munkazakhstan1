-- ============================================
-- MUN NIS Complete Database Setup
-- Run this script to set up all required tables
-- ============================================

-- 1. PROFILES TABLE
-- Stores user profile information with role-based system
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('founder', 'admin', 'general_secretary', 'deputy', 'participant')),
  school_id INTEGER,
  display_name TEXT,
  bio TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. USER CONFERENCES TABLE
-- Stores conferences created by admins/secretaries
CREATE TABLE IF NOT EXISTS public.user_conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name_ru TEXT NOT NULL,
  name_kk TEXT NOT NULL,
  name_en TEXT NOT NULL,
  city TEXT NOT NULL,
  location TEXT NOT NULL,
  date_start DATE,
  date_end DATE,
  date_ru TEXT,
  date_kk TEXT,
  date_en TEXT,
  description_ru TEXT,
  description_kk TEXT,
  description_en TEXT,
  image_url TEXT,
  registration_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for conferences
ALTER TABLE public.user_conferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conferences are viewable by everyone" ON public.user_conferences;
CREATE POLICY "Conferences are viewable by everyone" ON public.user_conferences
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create conferences" ON public.user_conferences;
CREATE POLICY "Authenticated users can create conferences" ON public.user_conferences
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Creators can update their conferences" ON public.user_conferences;
CREATE POLICY "Creators can update their conferences" ON public.user_conferences
  FOR UPDATE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "Creators can delete their conferences" ON public.user_conferences;
CREATE POLICY "Creators can delete their conferences" ON public.user_conferences
  FOR DELETE USING (creator_id = auth.uid());

-- 3. CONFERENCE COMMITTEES TABLE
-- Stores committees for each conference
CREATE TABLE IF NOT EXISTS public.conference_committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id UUID REFERENCES public.user_conferences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 15,
  priority INTEGER DEFAULT 0,
  countries TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for committees
ALTER TABLE public.conference_committees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Committees are viewable by everyone" ON public.conference_committees;
CREATE POLICY "Committees are viewable by everyone" ON public.conference_committees
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Conference creators can manage committees" ON public.conference_committees;
CREATE POLICY "Conference creators can manage committees" ON public.conference_committees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_conferences
      WHERE id = conference_committees.conference_id
      AND creator_id = auth.uid()
    )
  );

-- 4. DELEGATE APPLICATIONS TABLE
-- Stores conference registration applications
CREATE TABLE IF NOT EXISTS public.delegate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conference_id UUID REFERENCES public.user_conferences(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  school TEXT NOT NULL,
  grade INTEGER CHECK (grade >= 8 AND grade <= 12),
  motivation TEXT,
  primary_committee_id UUID REFERENCES public.conference_committees(id),
  secondary_committee_id UUID REFERENCES public.conference_committees(id),
  tertiary_committee_id UUID REFERENCES public.conference_committees(id),
  assigned_committee_id UUID REFERENCES public.conference_committees(id),
  assigned_country TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for applications
ALTER TABLE public.delegate_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON public.delegate_applications;
CREATE POLICY "Users can view their own applications" ON public.delegate_applications
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT creator_id FROM public.user_conferences WHERE id = conference_id
  ));

DROP POLICY IF EXISTS "Anyone can submit applications" ON public.delegate_applications;
CREATE POLICY "Anyone can submit applications" ON public.delegate_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Conference creators can update applications" ON public.delegate_applications;
CREATE POLICY "Conference creators can update applications" ON public.delegate_applications
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT creator_id FROM public.user_conferences WHERE id = conference_id
    )
  );

-- 5. NEWS TABLE
-- Stores news articles
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title_ru TEXT NOT NULL,
  title_kk TEXT,
  title_en TEXT,
  content_ru TEXT NOT NULL,
  content_kk TEXT,
  content_en TEXT,
  image_url TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "News is viewable by everyone" ON public.news;
CREATE POLICY "News is viewable by everyone" ON public.news
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Authenticated users can create news" ON public.news;
CREATE POLICY "Authenticated users can create news" ON public.news
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authors can update their news" ON public.news;
CREATE POLICY "Authors can update their news" ON public.news
  FOR UPDATE USING (author_id = auth.uid());

-- 6. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_conferences_creator ON public.user_conferences(creator_id);
CREATE INDEX IF NOT EXISTS idx_committees_conference ON public.conference_committees(conference_id);
CREATE INDEX IF NOT EXISTS idx_applications_conference ON public.delegate_applications(conference_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.delegate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_news_author ON public.news(author_id);

-- 7. AUTO-CREATE PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
