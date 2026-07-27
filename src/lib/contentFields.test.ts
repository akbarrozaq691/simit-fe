import { describe, expect, it } from 'vitest'
import {
  CONTENT_SECTIONS,
  HERO_IMAGE_KEY,
  changedValues,
  sectionValues,
} from './contentFields'

describe('changedValues', () => {
  it('returns nothing when the draft matches the original', () => {
    expect(changedValues({ a: 'one' }, { a: 'one' })).toEqual({})
  })

  it('returns only the keys that changed', () => {
    expect(changedValues({ a: 'one', b: 'two' }, { a: 'one', b: 'three' })).toEqual({
      b: 'three',
    })
  })

  it('treats a key missing from the original as a change', () => {
    expect(changedValues({}, { a: 'new' })).toEqual({ a: 'new' })
  })

  it('ignores whitespace-only differences', () => {
    expect(changedValues({ a: 'one' }, { a: '  one  ' })).toEqual({})
  })

  it('trims the values it does send', () => {
    expect(changedValues({ a: 'one' }, { a: '  two  ' })).toEqual({ a: 'two' })
  })

  it('reports clearing a field, so a row can be emptied', () => {
    expect(changedValues({ a: 'one' }, { a: '' })).toEqual({ a: '' })
  })

  it('ignores keys absent from the draft rather than clearing them', () => {
    // A section form only ever submits its own fields; the untouched keys of
    // other sections must not be wiped as a side effect.
    expect(changedValues({ a: 'one', other: 'keep' }, { a: 'two' })).toEqual({ a: 'two' })
  })
})

describe('sectionValues', () => {
  const section = CONTENT_SECTIONS[0]

  it('fills every field of the section', () => {
    const values = sectionValues(section, {})
    expect(Object.keys(values).sort()).toEqual(section.fields.map((f) => f.key).sort())
  })

  it('defaults a missing key to an empty string rather than undefined', () => {
    // An undefined value turns a controlled input into an uncontrolled one.
    expect(Object.values(sectionValues(section, {})).every((v) => v === '')).toBe(true)
  })

  it('reads existing values through', () => {
    expect(sectionValues(section, { hero_title: 'SIMIT 2026' }).hero_title).toBe('SIMIT 2026')
  })
})

describe('CONTENT_SECTIONS', () => {
  const keys = CONTENT_SECTIONS.flatMap((s) => s.fields.map((f) => f.key))

  it('has no duplicate keys across sections', () => {
    // A key edited by two forms would let one section silently overwrite the
    // other's value.
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has unique section ids, since they drive tab selection', () => {
    const ids = CONTENT_SECTIONS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps the hero image out of the text fields', () => {
    // It is set by upload, not typed — a text box holding a storage path
    // would invite hand-edited, broken paths.
    expect(keys).not.toContain(HERO_IMAGE_KEY)
  })
})
