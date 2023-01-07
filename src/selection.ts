
import {App} from "./index"
import {Edge, Station} from "./model"

type UserSelectable = Station | Edge

export class UserSelection {

  private app: App
  private selected: Set<UserSelectable> = new Set()

  constructor(app: App) {
    this.app = app
  }

  clear() {
    if (this.selected.size == 0) return

    this.selected.clear()
    this.app.draw()
  }
  add(x: UserSelectable) {
    if (this.selected.has(x)) return

    this.selected.add(x)
    this.app.draw()
  }

  has(x: UserSelectable) {
    return this.selected.has(x)
  }

  setTo(x: UserSelectable) {
    this.selected.clear();
    this.selected.add(x);
    this.app.draw()
  }


}
