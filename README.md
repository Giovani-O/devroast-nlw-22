# DevRoast 🔥

Cole seu código e receba análise com inteligência artificial. Escolha entre uma análise séria ou um roast completo do seu código.

## O que é DevRoast?

DevRoast é uma plataforma onde você pode enviar trechos de código para serem analisados por IA. Você escolhe como quer receber o feedback: de forma séria e construtiva, ou em modo roast, onde a análise é mais descontraída e crítica. Independente do modo escolhido, você receberá um score, sugestões de melhoria e um diff destacando as mudanças propostas.

## Funcionalidades

- **Análise com IA** - Envie seu código e receba análise automática
- **Dois modos de análise** - Escolha entre análise séria ou modo roast
- **Score detalhado** - Veja uma pontuação visual do seu código
- **Sugestões de melhoria** - Receba dicas para melhorar seu código
- **Leaderboard da comunidade** - Veja como seu código se compara com outros

## Como Usar

1. Cole seu código na área de entrada
2. Escolha o modo de análise (séria ou roast)
3. Clique em "Analisar"
4. Receba o resultado com score, feedback e sugestões

## Para Desenvolvedores

### Requisitos
- Node.js 18+
- npm ou yarn

### Instalação

```bash
npm install
```

### Rodando localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Outros comandos

```bash
npm run build    # Build para produção
npm run biome    # Verificar linting
npx tsc --noEmit # Verificar tipos TypeScript
```

### Banco de dados

#### Pré-requisitos adicionais
- Docker e Docker Compose

#### Configuração do ambiente

Crie um arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
DATABASE_URL=postgresql://devroast:devroast_pw@localhost:5432/devroast
AI_MODEL_VERSION=1.0.0
```

#### Subir o PostgreSQL com Docker

```bash
docker-compose up -d
```

#### Gerar e aplicar o schema

```bash
npm run db:generate   # Gera os arquivos de migration a partir do schema
npm run db:push       # Aplica o schema no banco de dados
```

#### Outros comandos de banco

```bash
npm run db:migrate    # Executa as migrations geradas
npm run db:studio     # Abre o Drizzle Studio para visualizar os dados
```

## Desenvolvido em

Projeto desenvolvido durante o evento **NLW (Next Level Week)** da **Rocketseat**.
