import Default from '../commands/index.js'

export const isDefaultOption = (flags: any, name: string) => {
  const a = typeof Default.flags as any
  return a[name].default !== flags[name]
}
