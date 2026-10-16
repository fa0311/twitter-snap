import {apps} from '../service/core.js'

const toPath = (reg: RegExp) => {
  return reg
    .toString()
    .slice(1, -1)
    .replaceAll('\\', '')
    .replaceAll(/\(\?<(\w+)>[^)]+\)/g, ':$1')
}

for (const app of apps) {
  console.log(`- \`${toPath(app.pattern)}\``)
  for (const route of app.routes) {
    console.log(`  - \`${toPath(route)}\``)
  }

  console.log()
}
