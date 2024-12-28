import {execSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

try {
  const helpOutput = execSync('node bin/run.js --help').toString()
  const readmePath = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'README.md')
  let readmeContent = fs.readFileSync(readmePath, 'utf8')

  const startPlaceholder = '<!-- COMMANDS_PLACEHOLDER_START -->'
  const endPlaceholder = '<!-- COMMANDS_PLACEHOLDER_END -->'

  const startCodeBlock = '```shell\n$ node bin/run.js --help'
  const endCodeBlock = '```'

  const startIndex = readmeContent.indexOf(startPlaceholder)
  const endIndex = readmeContent.indexOf(endPlaceholder)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Placeholders not found in README.md')
  }

  const commandsContent = readmeContent.substring(startIndex, endIndex + endPlaceholder.length)
  const updatedCommandsContent = `${startPlaceholder}\n\n${startCodeBlock}\n${helpOutput}\n${endCodeBlock}\n\n${endPlaceholder}`
  readmeContent = readmeContent.replace(commandsContent, updatedCommandsContent)

  fs.writeFileSync(readmePath, readmeContent, 'utf8')
  console.log('README.md updated successfully')
} catch (error) {
  console.error('Error updating README.md:', error)
}
