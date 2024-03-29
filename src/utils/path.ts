import os from 'node:os'

export const normalizePath = (path: string) => {
  if (path.startsWith('~/')) {
    return `${os.homedir()}${path.slice(1)}`
  }

  return path
}
