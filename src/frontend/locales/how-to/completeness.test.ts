import enHowTo from './en'
import deHowTo from './de'
import frHowTo from './fr'
// Not named `it`: that would shadow the test function.
import itHowTo from './it'

/**
 * The `HowToTranslation` type already forces every locale to carry every
 * key. This test guards the part the type cannot: that nobody widens the
 * type later, and that no value is an empty placeholder.
 */
function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

function leafValues(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  return Object.values(value as Record<string, unknown>).flatMap(leafValues)
}

const TRANSLATIONS = { de: deHowTo, fr: frHowTo, it: itHowTo }
const EXPECTED = leafPaths(enHowTo).sort()

describe('how-to translations', () => {
  it('has keys to translate', () => {
    expect(EXPECTED.length).toBeGreaterThan(50)
  })

  for (const [code, translation] of Object.entries(TRANSLATIONS)) {
    it(`${code} covers exactly the English keys`, () => {
      expect(leafPaths(translation).sort()).toEqual(EXPECTED)
    })
  }

  for (const [code, translation] of Object.entries({ en: enHowTo, ...TRANSLATIONS })) {
    it(`${code} has no empty strings`, () => {
      for (const value of leafValues(translation)) {
        expect(value.trim()).not.toBe('')
      }
    })
  }
})
