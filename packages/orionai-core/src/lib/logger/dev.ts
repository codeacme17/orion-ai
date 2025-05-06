import chalk from 'chalk'

import { LOG_PREFIX } from '.'

chalk.level = 3

export const DEV_LOGGER = {
  INFO: (content: string, ...args: any) => {
    console.log(chalk.bgBlue.white.bold(` ${LOG_PREFIX} INFO \n`), content)
    args.length > 0 &&
      args.forEach((arg: any) => {
        console.log(JSON.stringify(arg, null, 2))
      })
    console.log('\n')
  },

  SUCCESS: (content: string, ...args: any) => {
    console.log(chalk.bgGreen.white.bold(` ${LOG_PREFIX} SUCCESS \n`), content)
    args.length > 0 &&
      args.forEach((arg: any) => {
        console.log(JSON.stringify(arg, null, 2))
      })
    console.log('\n')
  },

  WARNING: (content: string, ...args: any) => {
    console.warn(chalk.bgYellow.black.bold(` ${LOG_PREFIX} WARNING \n`), content)
    args.length > 0 &&
      args.forEach((arg: any) => {
        console.log(JSON.stringify(arg, null, 2))
      })
    console.log('\n')
  },

  ERROR: (content: string | Error | unknown, ...args: any) => {
    console.error(chalk.bgRed.white.bold(` ${LOG_PREFIX} ERROR \n`), content)
    args.length > 0 &&
      args.forEach((arg: any) => {
        console.log(JSON.stringify(arg, null, 2))
      })
    console.log('\n')
  },
}
