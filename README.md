# GEIA

GEIA é uma plataforma escolar que combina um assistente de IA para alunos com ferramentas de gestão e supervisão para professores e administradores: chat com IA, deteção automática de mensagens de risco, e um fluxo para os alunos escalarem dúvidas para os professores.

## Funcionalidades principais

- **Chat com IA** — os alunos conversam com um assistente (via Ollama Cloud), com escolha de modelo e respostas em Markdown/LaTeX.
- **Moderação automática** — cada mensagem é classificada em background para detetar conteúdo de risco (ameaças, autolesão, etc.) e alertar os administradores.
- **Dúvidas aluno → professor** — um aluno pode escalar uma conversa para o seu professor, que responde numa thread dedicada, com acesso ao histórico da conversa de origem.
- **Gestão de turmas e utilizadores** — administradores gerem turmas, alunos e professores.
- **Ativação de conta por email** — novos utilizadores recebem um link de ativação (via Mailtrap).

## Stack

**Backend**
- Django 5 + Django REST Framework
- PostgreSQL (duas bases de dados: `default` e `processed`, para dados operacionais e analytics)
- [ollama](https://pypi.org/project/ollama/) — cliente para o Ollama Cloud (LLMs)
- django-cors-headers, python-dotenv

**Frontend**
- React 19 + Vite
- Tailwind CSS 4
- React Router
- react-markdown + remark-math + rehype-katex (respostas com Markdown e fórmulas matemáticas)

## Estrutura do projeto

```
GEIA-main/
├── backend/
│   ├── api/          # modelos, views, rotas da aplicação
│   ├── config/        # settings, urls, wsgi/asgi
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/  # Chat, dashboards, login, etc.
    │   └── main.jsx
    └── package.json
```

## Como correr localmente

### Requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Cria um ficheiro `.env` dentro de `backend/` com as seguintes variáveis:

```
SECRET_KEY=

DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

DB_processed_NAME=
DB_processed_USER=
DB_processed_PASSWORD=

EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

OLLAMA_HOST=
OLLAMA_TOKEN=
OLLAMA_MODEL=

FRONTEND_URL=http://localhost:5173
```

Depois:

```bash
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A app fica disponível em `http://localhost:5173`, e o backend em `http://localhost:8000`.

## Notas

- Este projeto está em desenvolvimento (fase académica); a API não tem ainda autenticação/permissões configuradas ao nível do Django REST Framework — o controlo de acesso por role é feito no frontend.
- Os modelos `ProcessingBatch`, `DailyClassSummary`, `TopicInsight` e `FrequentQuestion` (base `processed`) suportam um pipeline de analytics que é alimentado por um processo externo, não incluído neste repositório.
