import Default from '../commands'

export const isDefaultOption = (cmd: typeof Default, flags: any, name: string) => {
  const a = cmd.flags as any
  return a[name].default !== flags[name]
}
