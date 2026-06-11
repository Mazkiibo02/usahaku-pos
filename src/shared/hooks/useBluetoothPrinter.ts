import { create } from 'zustand';
import { EscPosEncoder, formatLeftRight, formatColumns } from '../utils/escPosEncoder';
import type { Transaction } from '@/src/features/transactions/types';

// Custom interfaces to satisfy TypeScript and ESLint without using explicit 'any'
interface BluetoothDevice {
  name?: string;
  gatt?: {
    connect: () => Promise<BluetoothRemoteGATTServer>;
    disconnect: () => void;
    connected: boolean;
  };
  addEventListener: (type: string, listener: () => void) => void;
}

interface BluetoothRemoteGATTServer {
  connect: () => Promise<BluetoothRemoteGATTServer>;
  disconnect: () => void;
  connected: boolean;
  getPrimaryService: (serviceUuid: string) => Promise<BluetoothRemoteGATTService>;
  getPrimaryServices: () => Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  getCharacteristics: () => Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  properties: {
    write: boolean;
    writeWithoutResponse: boolean;
  };
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  writeValueWithResponse?: (value: BufferSource) => Promise<void>;
  writeValue?: (value: BufferSource) => Promise<void>;
}

interface NavigatorWithBluetooth {
  bluetooth?: {
    requestDevice: (options: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
    }) => Promise<BluetoothDevice>;
  };
}

// Helper to format currency in IDR format (e.g. Rp15.000)
const formatPriceText = (price: number) => {
  return 'Rp' + Math.round(price).toLocaleString('id-ID');
};

// Helper to format Firestore timestamp or JS Date
const formatDateText = (timestamp: { toDate?: () => Date } | Date | null | undefined) => {
  if (!timestamp) return '-';
  let date: Date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp as Date | string | number);
  }
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date).replace(/\./g, ':');
};

/**
 * Builds the raw ESC/POS byte payload for printing a receipt.
 */
export function buildReceiptPayload(
  transaction: Transaction,
  storeName: string,
  outletName: string,
  cashierName: string,
  paperWidth: '58mm' | '80mm'
): Uint8Array {
  const width = paperWidth === '80mm' ? 48 : 32;
  const encoder = new EscPosEncoder();

  encoder.initialize();

  // Header (Centered, bold store name)
  encoder.alignCenter();
  encoder.bold(true);
  encoder.line(storeName.toUpperCase());
  encoder.bold(false);
  encoder.line(outletName);
  encoder.line('-'.repeat(width));

  // Metadata (Left aligned details)
  encoder.alignLeft();
  encoder.line(formatLeftRight('ID STRUK:', transaction.id.slice(-8).toUpperCase(), width));
  encoder.line(formatLeftRight('TANGGAL:', formatDateText(transaction.createdAt), width));
  encoder.line(formatLeftRight('KASIR:', cashierName, width));
  if (transaction.customerName) {
    encoder.line(formatLeftRight('PELANGGAN:', transaction.customerName, width));
  }
  encoder.line('-'.repeat(width));

  // Items List Header
  encoder.bold(true);
  encoder.line(formatColumns('ITEM', 'QTY', 'TOTAL', width));
  encoder.bold(false);

  // Items List
  transaction.items.forEach((item) => {
    const totalText = formatPriceText(item.price * item.quantity);
    const itemLabelWidth = width === 48 ? 28 : 16;
    if (item.name.length > itemLabelWidth) {
      // Print item name on its own line if it's too long, then print QTY & TOTAL below it
      encoder.line(item.name);
      encoder.line(formatColumns('', String(item.quantity), totalText, width));
    } else {
      encoder.line(formatColumns(item.name, String(item.quantity), totalText, width));
    }
  });
  encoder.line('-'.repeat(width));

  // Billing Totals
  const totalQty = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
  encoder.line(formatLeftRight('TOTAL ITEM', String(totalQty), width));

  if (transaction.subtotal !== undefined && transaction.subtotal !== transaction.totalAmount) {
    encoder.line(formatLeftRight('SUBTOTAL', formatPriceText(transaction.subtotal), width));
  }
  if (transaction.discount !== undefined && transaction.discount > 0) {
    encoder.line(formatLeftRight('DISKON', '-' + formatPriceText(transaction.discount), width));
  }
  if (transaction.taxAmount !== undefined && transaction.taxAmount > 0) {
    const taxRateStr = transaction.taxRate !== undefined ? `${transaction.taxRate}%` : '11%';
    encoder.line(formatLeftRight(`PAJAK (${taxRateStr})`, '+' + formatPriceText(transaction.taxAmount), width));
  }
  if (transaction.shippingCost !== undefined && transaction.shippingCost > 0) {
    encoder.line(formatLeftRight('ONGKOS KIRIM', '+' + formatPriceText(transaction.shippingCost), width));
  }

  encoder.line('-'.repeat(width));
  encoder.bold(true);
  encoder.line(formatLeftRight('TOTAL AKHIR', formatPriceText(transaction.totalAmount), width));
  encoder.bold(false);

  if (transaction.paymentMethod) {
    encoder.line(formatLeftRight('METODE PEMBAYARAN', transaction.paymentMethod, width));
  }
  encoder.line('-'.repeat(width));

  // Footer (Centered)
  encoder.alignCenter();
  encoder.bold(true);
  encoder.line('TERIMA KASIH');
  encoder.bold(false);
  encoder.line('Powered by Usahaku POS');
  encoder.feed(3);
  encoder.cut();

  return encoder.getPayload();
}

interface BluetoothPrinterStoreState {
  connectedDevice: BluetoothDevice | null;
  printerCharacteristic: BluetoothRemoteGATTCharacteristic | null;
  isConnecting: boolean;
  error: string | null;
  connectPrinter: () => Promise<void>;
  disconnectPrinter: () => Promise<void>;
  printReceipt: (
    transaction: Transaction,
    storeName: string,
    outletName: string,
    cashierName: string,
    paperWidth: '58mm' | '80mm'
  ) => Promise<void>;
}

// Global list of common BLE Thermal Printer Service UUIDs
const PRINTER_SERVICES = [
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb'
];

export const useBluetoothPrinterStore = create<BluetoothPrinterStoreState>((set, get) => ({
  connectedDevice: null,
  printerCharacteristic: null,
  isConnecting: false,
  error: null,

  connectPrinter: async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithBluetooth) : null;
    if (!nav || !nav.bluetooth) {
      set({ error: 'Browser ini tidak mendukung Web Bluetooth API.' });
      throw new Error('Web Bluetooth tidak didukung.');
    }

    set({ isConnecting: true, error: null });

    try {
      // 1. Request device using loose broad filter setup
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES,
      });

      if (!device.gatt) {
        throw new Error('GATT Server tidak tersedia pada printer ini.');
      }

      // Step 1: Call const server = await device.gatt.connect();
      const server = await device.gatt.connect();

      // Step 2: Immediately inject a mandatory stabilization delay: await new Promise(r => setTimeout(r, 1000));
      await new Promise((r) => setTimeout(r, 1000));

      if (!server || !server.connected) {
        throw new Error('GATT Server disconnected immediately after pairing.');
      }

      // Step 3: Do NOT loop through single getPrimaryService(uuid) calls. Instead, call the bulk retrieval immediately:
      const services = await server.getPrimaryServices();

      // Step 4: Iterate through the services array discovered from the hardware.
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
      for (const service of services) {
        try {
          // For each service, fetch its characteristics
          const characteristics = await service.getCharacteristics();

          // Step 5: Search for a characteristic where c.properties.write or c.properties.writeWithoutResponse is true.
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
        } catch (e) {
          console.warn('Gagal membaca karakteristik dari service:', e);
        }
        if (writeChar) {
          break;
        }
      }

      if (!writeChar) {
        throw new Error('Karakteristik menulis (Write) printer tidak ditemukan.');
      }

      // Add auto-disconnect listener to handle out of range / powered off events
      device.addEventListener('gattserverdisconnected', () => {
        console.log('Bluetooth printer disconnected.');
        set({ connectedDevice: null, printerCharacteristic: null });
      });

      set({
        connectedDevice: device,
        printerCharacteristic: writeChar,
        isConnecting: false,
        error: null,
      });
    } catch (err) {
      console.error('Bluetooth connection failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal terhubung ke printer Bluetooth.';
      set({
        isConnecting: false,
        error: errorMsg,
      });
      throw err;
    }
  },

  disconnectPrinter: async () => {
    const { connectedDevice } = get();
    if (connectedDevice && connectedDevice.gatt && connectedDevice.gatt.connected) {
      try {
        await connectedDevice.gatt.disconnect();
      } catch (err) {
        console.error('Error during disconnect:', err);
      }
    }
    set({ connectedDevice: null, printerCharacteristic: null, error: null });
  },

  printReceipt: async (transaction, storeName, outletName, cashierName, paperWidth) => {
    const { printerCharacteristic } = get();
    if (!printerCharacteristic) {
      set({ error: 'Printer tidak terhubung.' });
      throw new Error('Printer tidak terhubung.');
    }

    try {
      const payload = buildReceiptPayload(transaction, storeName, outletName, cashierName, paperWidth);

      // Write in chunked mode (max 20 bytes per write)
      const CHUNK_SIZE = 20;
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        const chunk = payload.slice(i, i + CHUNK_SIZE);

        if (typeof printerCharacteristic.writeValueWithoutResponse === 'function') {
          await printerCharacteristic.writeValueWithoutResponse(chunk);
        } else if (typeof printerCharacteristic.writeValueWithResponse === 'function') {
          await printerCharacteristic.writeValueWithResponse(chunk);
        } else if (typeof printerCharacteristic.writeValue === 'function') {
          await printerCharacteristic.writeValue(chunk);
        }

        // Small delay to allow thermal printer buffer processing
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    } catch (err) {
      console.error('Printing failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal mencetak struk belanja.';
      set({ error: errorMsg });
      throw err;
    }
  },
}));

/**
 * Stateful React hook that exposes printer status and action methods.
 */
export function useBluetoothPrinter() {
  const store = useBluetoothPrinterStore();
  
  return {
    connectedDevice: store.connectedDevice,
    printerCharacteristic: store.printerCharacteristic,
    isConnecting: store.isConnecting,
    error: store.error,
    connectPrinter: store.connectPrinter,
    disconnectPrinter: store.disconnectPrinter,
    printReceipt: store.printReceipt,
  };
}
