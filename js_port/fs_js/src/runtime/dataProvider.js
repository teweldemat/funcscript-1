class MapDataProvider {
  constructor(initial = {}, parent = null) {
    this.parent = parent;
    this.map = new Map();
    Object.entries(initial).forEach(([key, value]) => {
      this.set(key, value);
    });
  }

  _normalize(key) {
    return String(key).toLowerCase();
  }

  set(key, value) {
    this.map.set(this._normalize(key), value);
    return this;
  }

  get(key) {
    const normalized = this._normalize(key);
    if (this.map.has(normalized)) {
      return this.map.get(normalized);
    }
    if (this.parent && typeof this.parent.get === 'function') {
      return this.parent.get(key);
    }
    return null;
  }

  getData(key) {
    return this.get(key);
  }

  isDefined(key) {
    const normalized = this._normalize(key);
    if (this.map.has(normalized)) {
      return true;
    }
    if (this.parent && typeof this.parent.isDefined === 'function') {
      return this.parent.isDefined(key);
    }
    return false;
  }
}

module.exports = {
  MapDataProvider,
};
