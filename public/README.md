# Arquivos públicos

## Objetivo do módulo

Armazenar arquivos copiados diretamente para a raiz do build pelo Vite, sem processamento de imports.

## Responsabilidades e funcionalidades existentes

Contém apenas `vite.svg`, asset padrão do template.

## Dependências internas e externas

Depende do mecanismo de cópia da pasta `public` do Vite. Nenhum HTML, CSS ou componente referencia o arquivo. Módulos relacionados: `index.html`, `vite.config.ts` e `src/assets`.

## Pontos de entrada e fluxos de entrada

Não há entrada ativa. Um arquivo público seria acessado por caminho absoluto a partir da raiz.

## Arquivo crítico

Nenhum. `vite.svg` está órfão.

## Regras próprias do módulo

- Nenhum arquivo público pode conter segredo, configuração privada, dados de `tenant`, pacientes, profissionais ou usuários.
- Materiais públicos do produto devem ser genéricos ao domínio de fisioterapia/Pilates e possuir origem/licença conhecida.
- Arquivos que variam por clínica ou unidade devem ser obtidos por API/armazenamento apropriado, não por esta pasta.
- Fixtures do mock não devem ser publicadas aqui nem ficar acessíveis como assets estáticos de produção.

## Observações técnicas e débitos

- Remover o asset padrão após confirmação de que não será reutilizado.
- Preferir `src/assets` quando o arquivo precisar de hash e rastreamento pelo bundler.
