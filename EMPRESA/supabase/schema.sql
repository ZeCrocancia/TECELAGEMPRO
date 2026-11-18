-- =================================================================
-- SCHEMA BANCO DE DADOS - TECELAGEM PRO (SUPABASE / POSTGRESQL)
-- Disciplina: Programação para a Internet - FATEC ITU
-- =================================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE TELARES (Cadastro 1)
CREATE TABLE IF NOT EXISTS public.telares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    codigo_telar VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('Jato de Ar', 'Pinça', 'Lançadeira', 'Semicircular')) NOT NULL,
    rpm_nominal INT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Ativo', 'Manutenção', 'Inativo')) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE PRODUTOS / TECIDOS (Cadastro 2)
CREATE TABLE IF NOT EXISTS public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome_tecido VARCHAR(100) NOT NULL,
    composicao VARCHAR(100) NOT NULL,
    custo_metro_base NUMERIC(10, 2) NOT NULL,
    preco_venda_metro NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE APONTAMENTOS DE PRODUÇÃO & EFICIÊNCIA (Cadastro 3)
CREATE TABLE IF NOT EXISTS public.apontamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    telar_id UUID REFERENCES public.telares(id) ON DELETE CASCADE NOT NULL,
    produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE NOT NULL,
    data_apontamento DATE NOT NULL DEFAULT CURRENT_DATE,
    turnos VARCHAR(20) DEFAULT 'Turno A',
    metros_planejados NUMERIC(10, 2) NOT NULL,
    metros_produzidos NUMERIC(10, 2) NOT NULL,
    horas_paradas NUMERIC(4, 2) DEFAULT 0,
    eficiencia_percentual NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE WHEN metros_planejados > 0 THEN (metros_produzidos / metros_planejados) * 100 ELSE 0 END
    ) STORED,
    perda_financeira NUMERIC(12, 2) GENERATED ALWAYS AS (
        CASE WHEN metros_planejados > metros_produzidos 
             THEN (metros_planejados - metros_produzidos) * 15.50 -- valor estimado de margem/metro
             ELSE 0 END
    ) STORED,
    motivo_parada VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE PERFIS / LOGIN DOS USUÁRIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT,
    email TEXT UNIQUE NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Operador',
    setor VARCHAR(100) DEFAULT 'Produção',
    telefone VARCHAR(30),
    status VARCHAR(20) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gatilho para criar automaticamente o perfil quando um login é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nome_completo, cargo, setor)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
        COALESCE(NEW.raw_user_meta_data->>'cargo', 'Operador'),
        COALESCE(NEW.raw_user_meta_data->>'setor', 'Produção')
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- CONFIGURAÇÃO DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Conforme exigido no Item 4 do documento
-- =================================================================

-- Ativar RLS nas tabelas
ALTER TABLE public.telares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apontamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Politicas RLS para TELARES
CREATE POLICY "Usuários acessam apenas seus próprios telares" 
ON public.telares FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politicas RLS para PRODUTOS
CREATE POLICY "Usuários acessam apenas seus próprios produtos" 
ON public.produtos FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politicas RLS para APONTAMENTOS
CREATE POLICY "Usuários acessam apenas seus próprios apontamentos" 
ON public.apontamentos FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Politicas RLS para PERFIL DE USUÁRIOS
CREATE POLICY "Usuários acessam apenas seu próprio perfil"
ON public.usuarios FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
