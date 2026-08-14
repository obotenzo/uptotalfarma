# UPTOTALFARMA Dashboard

Sistema interno da rede **UP Total Farma** para acompanhar unidades, concorrentes e cobertura geográfica em um painel web.

## Visão Geral

O projeto foi construído com **Next.js** e organiza a leitura operacional da rede em duas experiências principais:

- **Dashboard principal**: visão executiva das 3 unidades com mapa, cobertura e concorrentes no raio de 2 km.
- **Página de concorrentes**: ranking por unidade e navegação detalhada para visualizar o mapa e a lista de concorrentes de cada ponto.

O objetivo é facilitar a análise da atuação regional sem depender de planilhas soltas ou leitura manual de mapas.

## Principais Funcionalidades

- autenticação simples por login e senha
- dashboard com foco executivo
- mapa interativo com **Leaflet**
- exibição do raio de atuação de **2 km**
- página dedicada para concorrentes por unidade
- ranking de unidades por volume de concorrentes
- navegação entre unidades por cards e controles visuais
- uso de dados locais em JSON

## Estrutura do Projeto

### `app/`

Rotas principais da aplicação.

- `app/page.jsx`: redireciona para login ou dashboard
- `app/login/page.jsx`: tela de autenticação
- `app/dashboard/page.jsx`: dashboard principal
- `app/concorrentes/page.jsx`: página de concorrentes
- `app/api/login/route.js`: cria a sessão autenticada
- `app/api/logout/route.js`: remove a sessão

### `components/`

Componentes reutilizáveis da interface.

- `dashboard-client.jsx`: interface principal do dashboard
- `competitors-client.jsx`: interface da página de concorrentes
- `map-panel.jsx`: mapa Leaflet com unidades e concorrentes
- `login-form.jsx`: formulário de login

### `data/`

- `dashboard-data.json`: base principal com unidades, concorrentes e coordenadas
- `produtos.json`: base auxiliar de produtos
- `produtos_up_totalfarma.xlsx`: planilha de apoio com produtos

### `lib/`

- `auth.js`: regras de autenticação e cookie de sessão
- `load-data.js`: leitura do JSON local e limpeza de campos sensíveis

### `public/`

Arquivos estáticos usados pela aplicação.

- `leaflet.js` e `leaflet.css`: biblioteca do mapa
- `tiles/`: imagens de mapa para renderização local
- `uptotalfarma-logo.png`: logo da rede

## Autenticação

A aplicação usa um cookie de sessão chamado `uptf_session`.

Fluxo de login:

1. o usuário informa login e senha na tela de autenticação
2. a rota `/api/login` valida as credenciais
3. se estiver tudo correto, o cookie de sessão é criado
4. o `proxy.js` protege as rotas privadas

Variáveis de ambiente usadas na autenticação:

- `UPTF_USERNAME`
- `UPTF_PASSWORD`

Se não forem definidas, o projeto usa as credenciais padrão configuradas no código.

## Dados

A base principal da aplicação é:

- [`data/dashboard-data.json`](./data/dashboard-data.json)

Esse arquivo concentra:

- informações das unidades
- concorrentes por unidade
- coordenadas geográficas
- dados de apoio para o mapa e ranking

Durante o carregamento, os campos de preço são removidos em `lib/load-data.js` para manter a experiência focada em cobertura e concorrência.

## Mapa

O mapa é renderizado com **Leaflet** e usa tiles locais.

No estado atual:

- o dashboard principal exibe o raio de **2 km ao redor de cada unidade**
- a página de concorrentes mantém o raio de **2 km** para análise por unidade
- os concorrentes aparecem conforme a unidade selecionada
- o mapa foi ajustado para dar leitura clara da cobertura da rede

## Layout

A interface foi desenhada para ser mais limpa e executiva:

- hero principal com identidade da marca
- cards com hierarquia visual mais forte
- ranking por unidade
- mapa em destaque
- página de concorrentes mais objetiva e menos carregada

## Scripts

### Desenvolvimento

```bash
npm run dev
```

### Build de produção

```bash
npm run build
```

### Executar produção

```bash
npm run start
```

## Dependências Principais

- `next`
- `react`
- `react-dom`
- `@supabase/supabase-js`

## Variáveis de Ambiente

Exemplo de configuração:

```env
UPTF_USERNAME=
UPTF_PASSWORD=
```

## Observações Importantes

- o projeto usa dados locais em JSON e arquivos auxiliares em `data/`
- o dashboard principal e a página de concorrentes têm comportamentos diferentes de raio
- a experiência principal é voltada para leitura rápida da rede
- a página de concorrentes foi pensada para análise por unidade

## Próximos Passos Possíveis

- migrar os dados locais para uma base remota
- adicionar filtros por região ou tipo de concorrente
- criar exportação de relatórios
- incluir histórico de alterações na base de dados
