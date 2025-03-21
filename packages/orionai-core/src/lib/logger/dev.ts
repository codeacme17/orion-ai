import chalk from 'chalk'

import { LOG_PREFIX } from '.'

chalk.level = 3

export const DEV_LOGGER = {
  INFO: (content: string, ...args: any) => {
    console.log(chalk.bgBlue.white.bold(` ${LOG_PREFIX} INFO `), content, ...args)
    console.log('\n')
  },

  SUCCESS: (content: string, ...args: any) => {
    console.log(chalk.bgGreen.white.bold(` ${LOG_PREFIX} SUCCESS `), content, ...args)
    console.log('\n')
  },

  WARNING: (content: string, ...args: any) => {
    console.log(chalk.bgYellow.black.bold(` ${LOG_PREFIX} WARNING `), content, ...args)
    console.log('\n')
  },

  ERROR: (content: string | Error | unknown, ...args: any) => {
    console.log(chalk.bgRed.white.bold(` ${LOG_PREFIX} ERROR `), content, ...args)
    console.log('\n')
  },
}
