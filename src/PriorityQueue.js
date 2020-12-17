export default class PriorityQueue {

  constructor() {

    this._arr = []
    this._prios = []
  }
  add(t, priority) {

    for (let i = 0; i < this._arr.length; i++)
      if (this._prios[i] < priority) {
        this._arr.splice(i, 0, t)
        this._prios.splice(i, 0, priority)
        return
      }

    this._arr.push(t)
    this._prios.push(priority)
  }

  forEach(f) {

    for (let i = 0; i < this._arr.length; i++)
      f(this._arr[i], i, this._arr)
  }

  delete(t) {
    for (let i = 0; i < this._arr.length; i++) {
      if (this._arr[i] === t) {
        this._arr.splice(i, 1)
        this._prios.splice(i, 1)
        return
      }
    }
  }
}
