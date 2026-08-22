class ArithmeticExpression {
  constructor(source) {
    this.source = String(source);
    this.index = 0;
  }

  evaluate() {
    if (this.source.length > 160) throw new Error("Expression is too long");
    const value = this.parseAdditive();
    this.skipWhitespace();
    if (this.index !== this.source.length || !Number.isFinite(value)) {
      throw new Error("Invalid arithmetic expression");
    }
    return value;
  }

  skipWhitespace() {
    while (/\s/.test(this.source[this.index] ?? "")) this.index += 1;
  }

  take(character) {
    this.skipWhitespace();
    if (this.source[this.index] !== character) return false;
    this.index += 1;
    return true;
  }

  parseAdditive() {
    let value = this.parseMultiplicative();
    while (true) {
      if (this.take("+")) value += this.parseMultiplicative();
      else if (this.take("-")) value -= this.parseMultiplicative();
      else return value;
    }
  }

  parseMultiplicative() {
    let value = this.parsePower();
    while (true) {
      if (this.take("*")) value *= this.parsePower();
      else if (this.take("/")) value /= this.parsePower();
      else if (this.take("%")) value %= this.parsePower();
      else return value;
    }
  }

  parsePower() {
    const value = this.parseUnary();
    return this.take("^") ? value ** this.parsePower() : value;
  }

  parseUnary() {
    if (this.take("+")) return this.parseUnary();
    if (this.take("-")) return -this.parseUnary();
    return this.parsePrimary();
  }

  parsePrimary() {
    if (this.take("(")) {
      const value = this.parseAdditive();
      if (!this.take(")")) throw new Error("Unclosed parenthesis");
      return value;
    }

    this.skipWhitespace();
    const rest = this.source.slice(this.index);
    const match = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
    if (!match) throw new Error("Expected a number");
    this.index += match[0].length;
    return Number(match[0]);
  }
}

export class Parser {
  evaluate(expression) {
    return new ArithmeticExpression(expression).evaluate();
  }

  static evaluate(expression) {
    return new ArithmeticExpression(expression).evaluate();
  }
}
