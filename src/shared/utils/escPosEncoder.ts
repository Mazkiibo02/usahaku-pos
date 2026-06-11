/**
 * ESC/POS Command Encoder for Thermal Receipt Printers (58mm / 80mm)
 */
export class EscPosEncoder {
  private buffer: number[] = [];
  private encoder: TextEncoder;

  constructor() {
    // Standard TextEncoder for converting strings to Uint8Array bytes
    this.encoder = new TextEncoder();
  }

  /**
   * Initialize printer (ESC @)
   */
  initialize(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  /**
   * Set text alignment to Left (ESC a 0)
   */
  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00);
    return this;
  }

  /**
   * Set text alignment to Center (ESC a 1)
   */
  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01);
    return this;
  }

  /**
   * Set text alignment to Right (ESC a 2)
   */
  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02);
    return this;
  }

  /**
   * Turn Bold On or Off (ESC E n)
   */
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  /**
   * Append raw text bytes
   */
  text(value: string): this {
    if (value) {
      const bytes = this.encoder.encode(value);
      this.buffer.push(...Array.from(bytes));
    }
    return this;
  }

  /**
   * Append text followed by line break (LF)
   */
  line(value: string = ''): this {
    this.text(value);
    this.buffer.push(0x0a);
    return this;
  }

  /**
   * Feed specified number of lines (LF)
   */
  feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  /**
   * Feed paper and cut (GS V 66 n)
   */
  cut(): this {
    // Cut feed command: GS V 66 3
    this.buffer.push(0x1d, 0x56, 0x42, 0x03);
    return this;
  }

  /**
   * Return the built payload as a Uint8Array
   */
  getPayload(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Format a line with left-aligned and right-aligned text blocks.
 */
export function formatLeftRight(left: string, right: string, width: number): string {
  const leftLen = left.length;
  const rightLen = right.length;
  
  if (leftLen + rightLen >= width) {
    // If the combined text exceeds layout width, truncate left text to fit
    const maxLeftLen = Math.max(0, width - rightLen - 1);
    const truncatedLeft = left.substring(0, maxLeftLen);
    const spacesCount = width - truncatedLeft.length - rightLen;
    return truncatedLeft + ' '.repeat(spacesCount) + right;
  } else {
    const spacesCount = width - leftLen - rightLen;
    return left + ' '.repeat(spacesCount) + right;
  }
}

/**
 * Format a 3-column line (primarily for item list: ITEM, QTY, TOTAL).
 */
export function formatColumns(col1: string, col2: string, col3: string, width: number): string {
  // Columns allocation based on width:
  // 58mm (32 chars): Col1 = 16, Col2 = 4, Col3 = 12
  // 80mm (48 chars): Col1 = 28, Col2 = 6, Col3 = 14
  const w1 = width === 48 ? 28 : 16;
  const w2 = width === 48 ? 6 : 4;
  const w3 = width === 48 ? 14 : 12;

  const c1 = col1.padEnd(w1).substring(0, w1);
  const c2 = col2.padStart(w2).substring(0, w2);
  const c3 = col3.padStart(w3).substring(0, w3);
  
  return c1 + c2 + c3;
}
