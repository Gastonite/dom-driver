




export default class SymbolTree {
  constructor(mapper) {

    this._mapper = mapper
    this._tree = [undefined, {}]
  }

  set(path, element, max) {

    let curr = this._tree

    const _max = max !== undefined
      ? max
      : path.length

    for (let i = 0; i < _max; i++) {
      const n = this._mapper(path[i])

      let child = curr[1][n]
      if (!child) {
        child = [undefined, {}]
        curr[1][n] = child
      }

      curr = child
    }

    curr[0] = element
  }

  getDefault(path, mkDefaultElement, max) {
    return this.get(path, mkDefaultElement, max)
  }

  /**
   * Returns the payload of the path
   * If a default element creator is given, it will insert it at the path
   */
  get(path, mkDefaultElement, max) {

    let curr = this._tree
    const _max = max !== undefined
      ? max
      : path.length

    for (let i = 0; i < _max; i++) {

      const n = this._mapper(path[i])
      let child = curr[1][n]

      if (!child) {

        if (mkDefaultElement) {

          child = [undefined, {}]
          curr[1][n] = child

        } else
          return

      }
      curr = child
    }

    if (mkDefaultElement && !curr[0])
      curr[0] = mkDefaultElement()

    return curr[0]
  }

  delete(path) {

    let curr = this._tree

    for (let i = 0; i < path.length - 1; i++) {

      const child = curr[1][this._mapper(path[i])]
      if (!child)
        return

      curr = child
    }

    delete curr[1][this._mapper(path[path.length - 1])]
  }
}
