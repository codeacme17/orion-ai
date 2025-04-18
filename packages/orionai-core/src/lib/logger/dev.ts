import chalk from 'chalk'

import { LOG_PREFIX } from '.'

chalk.level = 3

export const DEV_LOGGER = {
  INFO: (content: string, ...args: any) => {
    console.log(
      chalk.bgBlue.white.bold(` ${LOG_PREFIX} INFO \n`),
      JSON.stringify(content, null, 2),
      ...args,
    )
    console.log('\n')
  },

  SUCCESS: (content: string, ...args: any) => {
    console.log(
      chalk.bgGreen.white.bold(` ${LOG_PREFIX} SUCCESS \n`),
      JSON.stringify(content, null, 2),
      ...args,
    )
    console.log('\n')
  },

  WARNING: (content: string, ...args: any) => {
    console.warn(
      chalk.bgYellow.black.bold(` ${LOG_PREFIX} WARNING \n`),
      JSON.stringify(content, null, 2),
      ...args,
    )
    console.log('\n')
  },

  ERROR: (content: string | Error | unknown, ...args: any) => {
    console.error(
      chalk.bgRed.white.bold(` ${LOG_PREFIX} ERROR \n`),
      JSON.stringify(content, null, 2),
      ...args,
    )
    console.log('\n')
  },
}
