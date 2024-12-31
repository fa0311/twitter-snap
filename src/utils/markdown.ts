import {apps} from '../service/core'

const data = apps.map((app) => {
  return {
    base: app.pattern
      .toString()
      .slice(1, -1)
      .replaceAll('\\', '')
      .replaceAll(/\(\?<(\w+)>[^)]+\)/g, ':$1'),
    child: app.callbackList.map(([url]) => {
      return url
        .toString()
        .slice(1, -1)
        .replaceAll('\\', '')
        .replaceAll(/\(\?<(\w+)>[^)]+\)/g, ':$1')
    }),
  }
})

for (const app of data) {
  console.log(`- \`${app.base}\``)
  for (const child of app.child) {
    console.log(`  - \`${child}\``)
  }

  console.log()
}
