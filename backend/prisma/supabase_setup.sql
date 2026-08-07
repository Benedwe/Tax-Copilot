-- ==========================================
-- TAX COPILOT — SUPABASE DATABASE SETUP & RLS
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "DocumentType" AS ENUM (
        'NATIONAL_ID',
        'SALARY_SLIP',
        'BANK_STATEMENT',
        'BUSINESS_INCOME',
        'RECEIPT',
        'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DocumentStatus" AS ENUM (
        'UPLOADED',
        'PROCESSING',
        'EXTRACTED',
        'NEEDS_REVIEW',
        'VERIFIED',
        'FAILED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnStatus" AS ENUM (
        'DRAFT',
        'DOCUMENTS_PENDING',
        'READY_FOR_REVIEW',
        'REVIEWED',
        'GENERATED',
        'FILED'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Create User Table
CREATE TABLE IF NOT EXISTS public."User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'password',
    "tin" TEXT,
    "country" TEXT NOT NULL DEFAULT 'TZ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create TaxReturn Table
CREATE TABLE IF NOT EXISTS public."TaxReturn" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "year" INT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "grossIncome" DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    "taxableIncome" DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    "totalDeductions" DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    "taxDue" DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    "taxPaid" DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    "balance" DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Document Table
CREATE TABLE IF NOT EXISTS public."Document" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "fileName" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "taxReturnId" TEXT REFERENCES public."TaxReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create AiExtraction Table
CREATE TABLE IF NOT EXISTS public."AiExtraction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "documentId" TEXT NOT NULL REFERENCES public."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Deduction Table
CREATE TABLE IF NOT EXISTS public."Deduction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "taxReturnId" TEXT NOT NULL REFERENCES public."TaxReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(14, 2) NOT NULL,
    "sourceDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON public."User"("email");
CREATE INDEX IF NOT EXISTS "TaxReturn_userId_idx" ON public."TaxReturn"("userId");
CREATE INDEX IF NOT EXISTS "Document_userId_idx" ON public."Document"("userId");
CREATE INDEX IF NOT EXISTS "Document_taxReturnId_idx" ON public."Document"("taxReturnId");
CREATE INDEX IF NOT EXISTS "AiExtraction_documentId_idx" ON public."AiExtraction"("documentId");
CREATE INDEX IF NOT EXISTS "Deduction_taxReturnId_idx" ON public."Deduction"("taxReturnId");

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."TaxReturn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AiExtraction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Deduction" ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies
-- User Policy
DROP POLICY IF EXISTS "Users can view and update their own record" ON public."User";
CREATE POLICY "Users can view and update their own record"
ON public."User" FOR ALL
USING (auth.uid()::text = id OR auth.role() = 'service_role');

-- TaxReturn Policy
DROP POLICY IF EXISTS "Users can manage their own tax returns" ON public."TaxReturn";
CREATE POLICY "Users can manage their own tax returns"
ON public."TaxReturn" FOR ALL
USING (auth.uid()::text = "userId" OR auth.role() = 'service_role');

-- Document Policy
DROP POLICY IF EXISTS "Users can manage their own documents" ON public."Document";
CREATE POLICY "Users can manage their own documents"
ON public."Document" FOR ALL
USING (auth.uid()::text = "userId" OR auth.role() = 'service_role');

-- AiExtraction Policy
DROP POLICY IF EXISTS "Users can view extractions of their documents" ON public."AiExtraction";
CREATE POLICY "Users can view extractions of their documents"
ON public."AiExtraction" FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."Document" d
        WHERE d.id = "documentId" AND (d."userId" = auth.uid()::text OR auth.role() = 'service_role')
    )
);

-- Deduction Policy
DROP POLICY IF EXISTS "Users can manage deductions of their tax returns" ON public."Deduction";
CREATE POLICY "Users can manage deductions of their tax returns"
ON public."Deduction" FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public."TaxReturn" r
        WHERE r.id = "taxReturnId" AND (r."userId" = auth.uid()::text OR auth.role() = 'service_role')
    )
);

-- 10. Automatic Supabase Auth User Sync Trigger (Optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" (id, email, name, "authProvider")
  VALUES (
    new.id::text,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    'supabase'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public."User".name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on Supabase auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
