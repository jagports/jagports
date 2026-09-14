#!/usr/bin/env node

import { args, type Arg } from './utils/args'

import * as build from './commands/build'
import { help } from './commands/help'

const sharedOptions = {
  '--help': { type: 'boolean', description: 'Display usage information', alias: '-h' },
} satisfies Arg

const flags = args({
  ...build.options(),
  ...sharedOptions,
})
const command = flags._[0]

if (command) {
  help({
    invalid: command,
    usage: ['tailwindcss [options]'],
    options: { ...build.options(), ...sharedOptions },
  })
  process.exit(1)
}

if ((process.stdout.isTTY && process.argv[2] === undefined) || flags['--help']) {
  help({
    usage: ['tailwindcss [--input input.css] [--output output.css] [--watch] [options…]'],
    options: { ...build.options(), ...sharedOptions },
  })
  process.exit(0)
}

build.handle(flags)
