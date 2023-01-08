import {App} from "./index"
import {EdgeLayout, StationLayout} from "./layout"

type UserSelectableModel = { uuid: string }
type UserSelectable = StationLayout | EdgeLayout

export class UserSelection {

  private app: App
  private selected: Set<UserSelectableModel> = new Set()

  constructor(app: App) {
    this.app = app
  }

  clear() {
    if (this.selected.size == 0) return

    this.selected.clear()
    this.app.draw()
  }

  add(x: UserSelectable) {
    if (this.has(x)) return

    this.selected.add(x.model)
    this.app.draw()
  }

  delete(x: UserSelectable) {
    if (!this.has(x)) return
    this.selected.delete(x.model)
  }

  toggle(x: UserSelectable) {
    if (this.has(x)) {
      this.delete(x)
    } else {
      this.add(x)
    }
  }

  has(x: UserSelectable) {
    return this.selected.has(x.model)
  }

  setTo(x: UserSelectable) {
    this.selected.clear()
    this.add(x)
  }


}
