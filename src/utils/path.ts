import os from 'node:os'

export const normalizePath = (path: string) => {
  if (path.startsWith('~')) {
    return path.replace('~', os.homedir())
  }

  return path
}
