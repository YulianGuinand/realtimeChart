export class PaiementClass {
  constructor(found = 200) {
    this.found = found;
    this.quantity = 0;
  }

  buy(price, quantity = 1) {
    if (price > this.found) return;

    this.found -= price * quantity;

    this.quantity += quantity;
  }

  sell(price, quantity = 1) {
    if (this.quantity - quantity < 0) return;
    this.found += price * quantity;

    this.quantity -= quantity;
  }

  getData() {
    return { found: this.found, quantity: this.quantity };
  }
}
