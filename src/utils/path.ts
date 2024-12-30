import fs from 'node:fs/promises'
import os from 'node:os'
import {sep} from 'node:path'

export class DirectoryPath {
  constructor(public path: string) {}

  static from(path: string) {
    const p = path.startsWith('~/') ? `${os.homedir()}${path.slice(1)}` : path
    return new DirectoryPath(p.replaceAll(sep, '/'))
  }

  toFilePath(file: string) {
    return FilePath.fromDirectory(this.path, file)
  }

  toString() {
    return this.path
  }
}

export class FilePath {
  constructor(public dir: string, public name: string, public extension: string) {}

  static from(path: string) {
    const p = path.startsWith('~/') ? `${os.homedir()}${path.slice(1)}` : path
    const dirList = p.replaceAll(sep, '/').split('/')

    if (dirList.length === 1) {
      const [name, extension] = FilePath.nameSplit(dirList[0])
      return new FilePath('.', name, extension)
    }

    const dir = dirList.slice(0, -1).join('/')
    const [name, extension] = FilePath.nameSplit(dirList.at(-1)!)
    return new FilePath(dir, name, extension)
  }

  static fromDirectory(dir: string, file: string) {
    const p = dir.startsWith('~/') ? `${os.homedir()}${dir.slice(1)}` : dir
    const dirList = p.replaceAll(sep, '/')
    const [name, extension] = FilePath.nameSplit(file)
    return new FilePath(dirList, name, extension)
  }

  static nameSplit(name: string) {
    if (name.startsWith('.')) {
      return [name, '']
    }

    if (name.includes('.')) {
      const split = name.split('.')
      return [split.slice(0, -1).join('.'), split.at(-1)!]
    }

    return [name, '']
  }

  update({dir, name, extension}: {dir?: string; extension?: string; name?: string}) {
    return new FilePath(dir ?? this.dir, name ?? this.name, extension ?? this.extension)
  }

  sliceDirectory(slice: number) {
    const dirList = this.dir.split('/')
    return new FilePath(dirList.slice(slice).join('/'), this.name, this.extension)
  }

  toString() {
    if (this.extension === '') {
      return `${this.dir}/${this.name}`
    }

    return `${this.dir}/${this.name}.${this.extension}`
  }

  isExtension(ext: string) {
    return this.extension === ext
  }

  async writeFile(data: Parameters<typeof fs.writeFile>[1]) {
    if (this.dir !== '.') {
      await fs.mkdir(this.dir, {recursive: true})
    }

    fs.writeFile(this.toString(), data)
  }
}

export class URLPath extends FilePath {
  constructor(public url: URL, dir: string, name: string, extension: string) {
    super(dir, name, extension)
  }

  toString(): string {
    return this.url.toString()
  }

  static fromURL(url: string) {
    const u = new URL(url)
    const dirList = u.pathname.split('/')

    if (dirList.length === 1) {
      const [name, extension] = FilePath.nameSplit(dirList[0])
      return new URLPath(u, '.', name, extension)
    } else {
      const dir = dirList.slice(0, -1).join('/')
      const [name, extension] = FilePath.nameSplit(dirList.at(-1)!)
      return new URLPath(u, dir, name, extension)
    }
  }
}
