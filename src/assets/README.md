# Assets locais

## Objetivo do módulo

Armazenar imagens que podem ser empacotadas pelo Vite quando importadas pelo código.

## Responsabilidades e funcionalidades existentes

Contém quatro arquivos PNG: `BolaUnTra.png`, `abm_avatar.png`, `avatar.png` e `img_pilates.png`.

## Dependências internas e externas

- dependência externa potencial: pipeline de assets do Vite;
- módulos consumidores: `components/account-menu.tsx` e `components/AppTopbar/index.tsx` por composição;
- `abm_avatar.png` é o avatar sintético reutilizado no menu de perfil do topbar.

## Pontos de entrada e fluxos de entrada

Não há ponto de entrada próprio. Um asset entra no bundle quando é importado por TypeScript/CSS; nesta change, `abm_avatar.png` entra pelo menu de perfil compartilhado.

## Arquivos críticos

Nenhum arquivo é crítico ao fluxo atual. `img_pilates.png` e `avatar.png` são os maiores assets da pasta.

## Regras próprias do módulo

- Assets devem ser adequados ao domínio de fisioterapia/Pilates e possuir origem, licença e consumidor documentados.
- A pasta não pode conter imagens reais de pacientes, documentos clínicos ou outros dados pessoais usados como fixture.
- Avatares e imagens de demonstração devem ser sintéticos ou devidamente licenciados e não podem sugerir a existência de prontuário no MVP.
- Conteúdo específico de um `tenant` deve vir de armazenamento/API apropriados, nunca ser incorporado ao bundle público.

## Observações técnicas e débitos

- `abm_avatar.png` possui consumidor ativo no menu de perfil e não deve ser removido nesta change.
- Os demais PNGs permanecem sem consumidor confirmado pelo fluxo do topbar.
- Novos assets devem ter nome descritivo, origem/licença conhecida e consumidor documentado.
