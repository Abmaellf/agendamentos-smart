export interface CurrentHourContext {
  dateKey: string
  hour: number
  hourStart: string
  hourEnd: string
}

function partsFor(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>
}

function instantForLocalHour(
  local: Pick<ReturnType<typeof partsFor>, 'year' | 'month' | 'day' | 'hour'>,
  timeZone: string,
) {
  const naiveUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
  )
  let candidate = naiveUtc

  for (let index = 0; index < 3; index += 1) {
    const rendered = partsFor(new Date(candidate), timeZone)
    const renderedAsUtc = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
      rendered.second,
    )
    candidate = naiveUtc - (renderedAsUtc - candidate)
  }

  return new Date(candidate)
}

export function getCurrentHourContext(
  now: Date,
  timeZone: string,
): CurrentHourContext {
  const local = partsFor(now, timeZone)
  const hourStart = instantForLocalHour(local, timeZone)
  const nextLocalHour = new Date(
    Date.UTC(local.year, local.month - 1, local.day, local.hour + 1),
  )
  const nextParts = {
    year: nextLocalHour.getUTCFullYear(),
    month: nextLocalHour.getUTCMonth() + 1,
    day: nextLocalHour.getUTCDate(),
    hour: nextLocalHour.getUTCHours(),
  }
  const hourEnd = instantForLocalHour(nextParts, timeZone)

  return {
    dateKey: `${String(local.year).padStart(4, '0')}-${String(local.month).padStart(2, '0')}-${String(local.day).padStart(2, '0')}`,
    hour: local.hour,
    hourStart: hourStart.toISOString(),
    hourEnd: hourEnd.toISOString(),
  }
}
