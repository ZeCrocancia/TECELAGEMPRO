# Prompt inicial — Controle de Produção e Eficiência (TecelagemPro)

Crie neste repositório um site funcional de controle de produção para o setor têxtil (TecelagemPro), usando como fontes de verdade:

- `docs/design_system.md` — identidade visual industrial (Industrial Blue `#1e3a8a`, Accent Cyan `#0284c7`, cores semânticas de eficiência), tipografia Inter, espaçamentos e componentes.
- `supabase/schema.sql` — tabelas (`telares`, `produtos`, `apontamentos`), colunas, restrições de tipo, colunas computadas (`eficiencia_percentual`, `perda_financeira`) e políticas RLS.

Antes de implementar, leia esses dois arquivos e inspecione a estrutura existente do projeto. Preserve os arquivos e decisões já existentes que forem compatíveis. Faça a implementação nos diretórios atuais (`index.html`, `css/`, `js/` e outros arquivos necessários), sem introduzir frameworks de aplicação (como React, Vue ou Angular) ou ferramentas de build pesadas.

## Tecnologias e limites

- HTML semântico, CSS e JavaScript Vanilla.
- Tailwind CSS via CDN para a estilização, aplicando as cores personalizadas do projeto.
- Supabase JavaScript Client para autenticação e acesso ao banco de dados relacional.
- SweetAlert2 para confirmações de exclusão, avisos e mensagens de sucesso ou erro.
- Lucide Icons para iconografia padronizada em substituição a emojis.
- Não use TypeScript, jQuery ou bibliotecas de gráficos pesadas.
- Mantenha o código organizado em módulos ou arquivos JavaScript limpos, com responsabilidades bem separadas.

## Funcionalidades obrigatórias

### 1. Acesso e Sessão (Autenticação)
- Criar uma tela de login e cadastro de novos utilizadores utilizando o Supabase Auth (email e senha).
- Gerir a sessão do usuário com o cliente oficial do Supabase, permitindo efetuar logout.
- Enquanto não houver sessão ativa, exibir exclusivamente a tela de autenticação; após autenticar, exibir o dashboard principal e o menu de navegação.
- Exibir mensagens de erro claras em português em caso de falhas no login ou registo.

### 2. Gestão de Cadastros (CRUDs Completos)
A aplicação deve implementar as operações de CRUD (Create, Read, Update, Delete) com confirmações via SweetAlert2 para as três entidades do banco de dados:
- **Telares (Cadastro 1):** Gerenciar códigos de telares, tipos ('Jato de Ar', 'Pinça', 'Lançadeira', 'Semicircular'), RPM nominal e status ('Ativo', 'Manutenção', 'Inativo').
- **Produtos / Tecidos (Cadastro 2):** Gerenciar nome do tecido, composição, custo do metro base e preço de venda por metro (formatados em BRL).
- **Apontamentos de Produção (Eficiência) (Cadastro 3):** Registos diários vinculando um Telar e um Produto, informando data, turno, metros planejados, metros produzidos, horas paradas e motivo da parada. A eficiência percentual e a perda financeira calculadas pelo banco devem ser exibidas claramente.

### 3. Dashboard Industrial
- Criar um painel inicial que resuma os indicadores-chave do setor: Eficiência Média do período, Total de Metros Produzidos vs Planeados, e Perdas Financeiras Totais.
- Utilizar as cores semânticas do design system (Verde para alta eficiência, Amarelo para média e Vermelho para baixa/perigo).
- Permitir filtrar os apontamentos por período, telar ou produto, com estados vazios e de carregamento bem tratados.

## Design e Experiência do Utilizador
- Siga rigorosamente o Design System definido em `docs/design_system.md`, aplicando a paleta Industrial Blue (`#1e3a8a`) e o fundo `slate-50`.
- Criar layout responsivo adaptado para computadores e dispositivos móveis, com navegação fluida entre Dashboard, Telares, Produtos e Apontamentos.
- Garantir formulários bem estruturados, rótulos claros, feedback visual imediato e tratamento adequado de erros com SweetAlert2.

## Integração e Segurança Supabase
- Utilize apenas a URL e a chave pública (`anon`) do projeto Supabase no frontend. Nunca exponha chaves administrativas (`service_role`).
- Respeite integralmente as políticas de Row Level Security (RLS) configuradas no banco de dados, garantindo que cada operação envie o `user_id` autenticado (`auth.uid()`).
- Utilize um mecanismo simples em tempo de execução para injetar a configuração pública do Supabase no JavaScript, documentando como preencher um ficheiro `.env.example`.

## Entrega
Implemente a aplicação de forma funcional e integrada ao Supabase, pronta para publicação no GitHub Pages. Ao concluir, resuma os ficheiros criados/alterados e as instruções de uso.