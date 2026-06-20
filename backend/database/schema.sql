CREATE TABLE IF NOT EXISTS solicitacoes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    nip TEXT NOT NULL,
    setor TEXT NOT NULL,
    contato TEXT NOT NULL,
    email_responsavel TEXT,
    nome_videoconferencia TEXT NOT NULL,
    local_plataforma TEXT NOT NULL,
    local_fisico TEXT,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    prioridade TEXT NOT NULL,
    link TEXT,
    solicitar_link BOOLEAN NOT NULL DEFAULT false,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    motivo_rejeicao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videoconferencias (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    plataforma TEXT NOT NULL,
    local_fisico TEXT,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    data_fim DATE,
    prioridade TEXT NOT NULL,
    responsavel TEXT,
    setor TEXT,
    link TEXT,
    observacoes TEXT,
    concluida BOOLEAN NOT NULL DEFAULT false,
    solicitacao_id INTEGER REFERENCES solicitacoes(id),
    recurrence_group_id TEXT,
    recurrence_type TEXT,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id TEXT,
    usuario TEXT,
    detalhes JSONB,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS email_responsavel TEXT;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS solicitar_link BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS local_fisico TEXT;
ALTER TABLE videoconferencias ADD COLUMN IF NOT EXISTS local_fisico TEXT;
ALTER TABLE videoconferencias ADD COLUMN IF NOT EXISTS data_fim DATE;
ALTER TABLE videoconferencias ADD COLUMN IF NOT EXISTS recurrence_group_id TEXT;
ALTER TABLE videoconferencias ADD COLUMN IF NOT EXISTS recurrence_type TEXT;

CREATE INDEX IF NOT EXISTS idx_solicitacoes_status_criado ON solicitacoes (status, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_duplicidade_pendente
    ON solicitacoes (nip, nome_videoconferencia, data, horario) WHERE status = 'pendente';
CREATE INDEX IF NOT EXISTS idx_videoconferencias_agenda ON videoconferencias (concluida, data, horario);
CREATE INDEX IF NOT EXISTS idx_videoconferencias_periodo
    ON videoconferencias (concluida, data, data_fim, horario);
CREATE INDEX IF NOT EXISTS idx_videoconferencias_duplicidade
    ON videoconferencias (nome, plataforma, data, horario);
CREATE INDEX IF NOT EXISTS idx_audit_logs_criado ON audit_logs (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON audit_logs (entidade, entidade_id);
