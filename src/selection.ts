import {App} from "./index"
import {StationLayout} from "./layout"

type UserSelectableModel = { uuid: string }
type UserSelectable = StationLayout

export class UserSelection {

  private app: App
  private selected: Set<string> = new Set()

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

    this.selected.add(x.model.id)
    this.app.draw()
  }

  delete(x: UserSelectable) {
    if (!this.has(x)) return
    this.selected.delete(x.model.id)
  }

  toggle(x: UserSelectable) {
    if (this.has(x)) {
      this.delete(x)
    } else {
      this.add(x)
    }
  }

  has(x: UserSelectable) {
    return this.selected.has(x.model.id)
  }

  setTo(x: UserSelectable) {
    this.selected.clear()
    this.add(x)
  }


}
