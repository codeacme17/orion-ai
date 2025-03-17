import chalk from 'chalk'

import { LOG_PREFIX } from '.'

chalk.level = 3

export const DEV_LOGGER = {
  INFO: (content: string) => {
    console.log(chalk.bgBlue.white.bold(` ${LOG_PREFIX} INFO:`), content)
  },

  SUCCESS: (content: string) => {
    console.log(chalk.bgGreen.white.bold(` ${LOG_PREFIX} SUCCESS:`), content)
  },

  WARNING: (content: string) => {
    console.log(chalk.bgYellow.black.bold(` ${LOG_PREFIX} WARNING:`), content)
  },

  ERROR: (content: string) => {
    console.log(chalk.bgRed.white.bold(` ${LOG_PREFIX} ERROR:`), content)
  },
}
