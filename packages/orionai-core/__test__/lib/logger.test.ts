import { DEV_LOGGER } from '@/lib/logger'
import chalk from 'chalk'
import { describe, it } from 'vitest'

describe('logger', () => {
  it('should log a INFO message', () => {
    DEV_LOGGER.INFO('This is a INFO message')
  })

  it('should log a SUCCESS message', () => {
    DEV_LOGGER.SUCCESS('This is a SUCCESS message')
  })

  it('should log a WARNING message', () => {
    DEV_LOGGER.WARNING('This is a WARNING message')
  })

  it('should log a ERROR message', () => {
    DEV_LOGGER.ERROR('This is a ERROR message')
  })
})
