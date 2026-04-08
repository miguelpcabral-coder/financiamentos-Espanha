-- Tabela de solicitudes de financiamento
CREATE TABLE solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  nif TEXT NOT NULL,
  situacion_laboral TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  nuevo_usado TEXT NOT NULL,
  fecha_matriculacion TEXT,
  precio NUMERIC NOT NULL,
  entrada NUMERIC DEFAULT 0,
  plazo INTEGER NOT NULL,
  importe NUMERIC NOT NULL,
  documentos JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('financiamentos-docs', 'financiamentos-docs', true);

-- Policy: permitir uploads anónimos
CREATE POLICY "Allow public uploads"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'financiamentos-docs');

CREATE POLICY "Allow public reads"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'financiamentos-docs');

-- Policy: permitir insert anónimo (cliente submete sem login)
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert"
  ON solicitudes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow service role all"
  ON solicitudes FOR ALL
  TO service_role
  USING (true);
