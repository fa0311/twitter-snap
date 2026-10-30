import LineBreaker from 'linebreak'

// Groups graphemes into the units a line may break between (UAX #14, as browsers do).
// A newline is kept as a unit of its own so the renderers can turn it into a forced break.
export const splitLineBreak = <T extends {char: string}>(chars: T[]): T[][] => {
  const breaker = new LineBreaker(chars.map(({char}) => char).join(''))
  const units: T[][] = [[]]
  let position = 0
  let next = breaker.nextBreak()

  for (const data of chars) {
    if (data.char === '\n') {
      units.push([data], [])
    } else {
      units.at(-1)!.push(data)
    }

    position += data.char.length
    while (next && next.position <= position) {
      units.push([])
      next = breaker.nextBreak()
    }
  }

  return units.filter((unit) => unit.length > 0)
}
