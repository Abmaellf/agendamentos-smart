# Assets locais

## Objetivo do módulo

Armazenar imagens que podem ser empacotadas pelo Vite quando importadas pelo código.

## Responsabilidades e funcionalidades existentes

Contém quatro arquivos PNG: `BolaUnTra.png`, `abm_avatar.png`, `avatar.png` e `img_pilates.png`.

## Dependências internas e externas

- dependência externa potencial: pipeline de assets do Vite;
- módulos relacionados potenciais: Header, conta e páginas de autenticação/agenda;
- nenhum import ativo foi identificado.

## Pontos de entrada e fluxos de entrada

Não há ponto de entrada atual. Um asset só entra no bundle se for importado por TypeScript/CSS.

## Arquivos críticos

Nenhum arquivo é crítico ao fluxo atual. `img_pilates.png` e `avatar.png` são os maiores assets da pasta.

## Regras próprias do módulo

- Assets devem ser adequados ao domínio de fisioterapia/Pilates e possuir origem, licença e consumidor documentados.
- A pasta não pode conter imagens reais de pacientes, documentos clínicos ou outros dados pessoais usados como fixture.
- Avatares e imagens de demonstração devem ser sintéticos ou devidamente licenciados e não podem sugerir a existência de prontuário no MVP.
- Conteúdo específico de um `tenant` deve vir de armazenamento/API apropriados, nunca ser incorporado ao bundle público.

## Observações técnicas e débitos

- Todos os PNGs estão órfãos no grafo ativo.
- Confirmar uso de produto antes de removê-los.
- Novos assets devem ter nome descritivo, origem/licença conhecida e consumidor documentado.
