# TecelagemPro - Sistema de Gestão e Eficiência Têxtil

**Projeto Integrador - Disciplina: Programação para a Internet**  
**Faculdade de Tecnologia de Itu (FATEC ITU)**  
**Curso:** Tecnólogo em Gestão da Tecnologia da Informação (GTI)  
**Professor:** Ricardo Leme  
**Data de Entrega:** 17/11/2026  

---

## 1. Problemática Identificada
Em indústrias têxteis e de tecelagem, a falta de precisão na mensuração da eficiência dos telares gera refugos invisíveis, paradas não planejadas e divergência entre a produção teórica e a real. Sem o cálculo do rendimento real por máquina e por tipo de tecido, a gestão financeira sofre com prejuízos acumulados por capacidade ociosa, desperdício de matéria-prima e atrasos nas entregas.

## 2. Objetivo da Aplicação
O **TecelagemPro** é uma aplicação web completa desenvolvida para solucionar a incerteza operacional no setor de tecelagem. O sistema centraliza a gestão de máquinas (telares), catálogo de produtos/tecidos e os apontamentos diários de produção, calculando automaticamente as taxas de eficiência e o impacto financeiro (prejuízo acumulado por metros não produzidos).

## 3. Integrantes do Grupo
- Lucas Henrique Valentim Crispim
- Gabriel Henrique Alcalde de Almeida
- Caio Rossetto

## 4. Tecnologias Utilizadas (Stack Obrigatória)
- **Front-end:** HTML5, CSS3, JavaScript Vanilla (ES6+).
- **Estilização & UI:** Tailwind CSS (via CDN), SweetAlert2 (Mensagens/Alertas), Lucide Icons.
- **Backend & Banco de Dados:** Supabase (Authentication, PostgreSQL Database, Row Level Security - RLS).
- **Versionamento & Hospedagem:** Git, GitHub e GitHub Pages.

---

## 5. Estrutura de Cadastros (CRUDs Obrigatórios)
1. **Cadastro de Telares (Máquinas):**
   - Campos: Código do Telar, Tipo (Jato de Ar, Pinça, Lançadeira, Semicircular), RPM Nominal e Status Operacional.
2. **Cadastro de Produtos (Tecidos):**
   - Campos: Nome do Tecido, Composição, Custo por Metro Base, Preço de Venda por Metro.
3. **Apontamento de Produção & Eficiência:**
   - Campos: Telar Vinculado, Produto Vinculado, Data, Turno, Metros Planejados, Metros Produzidos e Horas Paradas.
   - *Cálculos Automáticos:* Eficiência Operacional (%) e Perda Financeira Estimada (R$).

---

## 6. Instruções de Instalação e Configuração

### Configuração do Supabase:
1. Crie um projeto no [Supabase](https://supabase.com/).
2. No menu **SQL Editor**, cole e execute o conteúdo do arquivo `supabase/schema.sql`.
3. Em **Project Settings > API**, copie a **URL do projeto** e a **chave anon (public)**.
4. Preencha o arquivo `js/config.js` com os valores públicos do seu projeto:
   ```javascript
   window.__SUPABASE_CONFIG__ = {
     url: 'https://SEU_PROJETO.supabase.co',
     anonKey: 'SUA_CHAVE_PUBLICA_ANON'
   };
   ```
5. Também há um exemplo em `.env.example`, útil para documentar os valores em ambientes de CI ou DevOps.

### Execução Local:
Abra o arquivo `index.html` em qualquer navegador ou utilize uma extensão como Live Server no VS Code.

### Publicação no GitHub Pages:
1. Faça o commit e push do projeto para o GitHub.
2. Acesse **Settings > Pages**.
3. Escolha a branch principal e configure a pasta raiz do site.
4. A aplicação estará disponível no link gerado.

---

## 7. Estrutura do Projeto
- `index.html` — interface principal com autenticação, navegação e telas do sistema.
- `css/styles.css` — estilos e componentes visuais do design system.
- `js/config.js` — injeção em tempo de execução da URL e da anon key do Supabase.
- `js/app.js` — lógica de autenticação, CRUD, filtros e dashboard.
- `supabase/schema.sql` — schema SQL com as tabelas e políticas RLS.
- `.env.example` — exemplo de variáveis públicas do Supabase para documentação.

---

## 8. Funcionalidades Implementadas
- Autenticação com Supabase Auth (login e cadastro).
- Sessão ativa com logout.
- CRUD dos telares, produtos e apontamentos.
- Dashboard com métricas de eficiência, produção, planejamento e perdas.
- Filtros por período, telar e produto.
- Feedback visual por SweetAlert2 e layout responsivo em Tailwind CSS.

---

## 9. Observações
A aplicação está pronta para integração, mas exige a configuração pública do projeto no Supabase antes da utilização real.
