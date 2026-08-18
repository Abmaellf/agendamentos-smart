# Tema claro/escuro baseado em classes

## Objetivo do módulo

Oferecer seleção de tema `light`, `dark` ou `system` por classe no elemento raiz e persistência em `localStorage`.

## Responsabilidades e funcionalidades existentes

- `theme-provider.tsx`: contexto, persistência e aplicação da classe;
- ` mode-toggle.tsx`: menu para escolher o tema.

## Dependências internas e externas

- internas: botão e dropdown de `components/ui`;
- externas: React e Lucide;
- módulo relacionado: `globals.css`.

## Pontos de entrada e fluxos de entrada

Não há ponto de entrada ativo. Os imports/montagem em `App` e `AppLayout` estão comentados.

## Arquivos críticos

- `theme-provider.tsx`: implementação completa, porém desconectada;
- ` mode-toggle.tsx`: possui espaço inicial no nome do arquivo.

## Regras próprias do módulo

- Qualquer tema habilitado deve preservar contraste e indicação textual dos estados da agenda.
- Preferência de tema é do usuário e não deve ser compartilhada entre usuários ou unidades pelo mock.
- Aplicar tema não pode interferir em sessão, `tenantId`, permissões ou dados de negócio.
- Se o módulo continuar fora do MVP, seus controles não devem aparecer como funcionalidade parcialmente operante.

## Observações técnicas e débitos

- O módulo é órfão.
- `useTheme` não detecta ausência do provider porque o contexto possui um valor inicial; a validação `context === undefined` nunca ocorre.
- Renomear o arquivo com espaço somente junto da correção dos imports.
