const subjectModules = import.meta.glob([
  '/src/features/**/*.ts',
  '/src/features/**/*.tsx',
])

/**
 * Carrega módulos de produção dentro de cada caso de teste.
 *
 * A feature ainda não existe por decisão test-first. O carregamento tardio faz o
 * Vitest coletar todos os casos e registrar um baseline vermelho por contrato
 * ausente, em vez de abortar toda a suíte no primeiro import não resolvido.
 */
export async function loadSubject<T>(subjectUrl: URL): Promise<T> {
  const importer = subjectModules[subjectUrl.pathname]

  if (!importer) {
    throw new Error(
      `Módulo de produção ainda não implementado: ${subjectUrl.pathname}`,
    )
  }

  return importer() as Promise<T>
}
