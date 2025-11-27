import { describe, it, expect } from 'vitest'

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    expect('SalonMate').toContain('Salon')
  })

  it('should handle array operations', () => {
    const features = ['review', 'instagram', 'dashboard']
    expect(features).toHaveLength(3)
    expect(features).toContain('review')
  })
})
