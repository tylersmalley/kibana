const canStack = (function () {
  const err = new Error();
  return !!err.stack;
}());

export class KbnError {
  constructor(msg, constructor) {
    this.message = msg;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, constructor || KbnError);
    } else if (canStack) {
      this.stack = (new Error()).stack;
    } else {
      this.stack = '';
    }
  }

  /**
   * If the error permits, propagate the error to be rendered on screen
   */
  displayToScreen() {
    throw this;
  }
}

export class SavedObjectNotFound extends KbnError {
  constructor(type, id) {
    const idMsg = id ? ` (id: ${id})` : '';
    super(
      `Could not locate that ${type}${idMsg}`,
      SavedObjectNotFound);

    this.savedObjectType = type;
    this.savedObjectId = id;
  }
}
