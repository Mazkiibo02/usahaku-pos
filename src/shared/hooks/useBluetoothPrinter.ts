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

interface WebUsbPrinterEndpoint {
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous' | 'control';
  endpointNumber: number;
}

interface WebUsbPrinterAlternateInterface {
  alternateSetting: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  interfaceName?: string;
  endpoints: WebUsbPrinterEndpoint[];
}

interface WebUsbPrinterInterface {
  interfaceNumber: number;
  alternate: WebUsbPrinterAlternateInterface;
  alternates: WebUsbPrinterAlternateInterface[];
  claimed: boolean;
}

interface WebUsbPrinterConfiguration {
  configurationValue: number;
  configurationName?: string;
  interfaces: WebUsbPrinterInterface[];
}

interface WebUsbPrinterDevice {
  open: () => Promise<void>;
  close: () => Promise<void>;
  selectConfiguration: (configurationValue: number) => Promise<void>;
  claimInterface: (interfaceNumber: number) => Promise<void>;
  releaseInterface: (interfaceNumber: number) => Promise<void>;
  transferOut: (endpointNumber: number, data: BufferSource) => Promise<{ bytesWritten: number; status: string }>;
  configuration?: WebUsbPrinterConfiguration | null;
  configurations: WebUsbPrinterConfiguration[];
  productName?: string;
}

interface NavigatorWithBluetooth {
  bluetooth?: {
    requestDevice: (options: {
      acceptAllDevices?: boolean;
      optionalServices?: string[];
    }) => Promise<BluetoothDevice>;
  };
}

interface SerialPort {
  open: (options: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  writable: {
    getWriter: () => {
      write: (data: Uint8Array) => Promise<void>;
      releaseLock: () => void;
    };
  };
}

interface NavigatorWithBluetoothSerialAndUsb extends NavigatorWithBluetooth {
  serial?: {
    requestPort: (options?: { filters?: any[] }) => Promise<SerialPort>;
  };
  usb?: {
    requestDevice: (options: { filters: Array<{ interfaceClass?: number }> }) => Promise<WebUsbPrinterDevice>;
    getDevices: () => Promise<WebUsbPrinterDevice[]>;
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

  // Web Serial USB printer state/methods
  connectedUsbPort: SerialPort | null;
  isConnectingUsb: boolean;
  connectUsbPrinter: () => Promise<void>;
  disconnectUsbPrinter: () => Promise<void>;
  printViaUsb: (rawBytes: Uint8Array) => Promise<void>;

  // WebUSB Printer additions
  connectedUsbDevice: WebUsbPrinterDevice | null;
  usbInterfaceNumber: number | null;
  usbEndpointOut: number | null;
  connectWebUsbPrinter: () => Promise<void>;

  printReceipt: (
    transaction: Transaction,
    storeName: string,
    outletName: string,
    cashierName: string,
    paperWidth: '58mm' | '80mm'
  ) => Promise<void>;
  printViaRawBt: (rawBytes: Uint8Array) => void;
}

// Global list of common BLE Thermal Printer Service UUIDs
const PRINTER_SERVICES = [
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC / RPP02N Standard (Target #1)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Generic Custom TFE0
  '0000ffe1-0000-1000-8000-00805f9b34fb', // Xprinter / Generic Custom TFE1
  '000018f0-0000-1000-8000-00805f9b34fb'  // Standard Printing Service
];

export const useBluetoothPrinterStore = create<BluetoothPrinterStoreState>((set, get) => ({
  connectedDevice: null,
  printerCharacteristic: null,
  isConnecting: false,
  error: null,

  // Web Serial USB State
  connectedUsbPort: null,
  isConnectingUsb: false,

  // WebUSB State
  connectedUsbDevice: null,
  usbInterfaceNumber: null,
  usbEndpointOut: null,

  connectPrinter: async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithBluetoothSerialAndUsb) : null;
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

      // 2. Connect to the GATT server and query services one-by-one with isolated retry state
      let server: BluetoothRemoteGATTServer | null = null;
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;

      for (const uuid of PRINTER_SERVICES) {
        try {
          if (!server || !server.connected) {
            console.log(`Connecting to GATT server for service ${uuid}...`);
            server = await device.gatt.connect();
            await new Promise((r) => setTimeout(r, 1000)); // 1 second stabilization delay
          }

          if (!server || !server.connected) {
            console.warn(`GATT Server not connected, skipping service ${uuid}`);
            continue;
          }

          console.log(`Querying service ${uuid} directly...`);
          const service = await server.getPrimaryService(uuid);
          const characteristics = await service.getCharacteristics();

          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }

          if (writeChar) {
            console.log(`Found write characteristic on service ${uuid}`);
            break;
          }
        } catch (e) {
          console.warn(`Failed target query for service ${uuid}:`, e);
          // If connection dropped during query, reset server to force reconnection in next iteration
          if (server && !server.connected) {
            server = null;
          }
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

  connectUsbPrinter: async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithBluetoothSerialAndUsb) : null;
    if (!nav || !nav.serial) {
      set({ error: 'Browser ini tidak mendukung Web Serial API.' });
      throw new Error('Web Serial tidak didukung.');
    }

    set({ isConnectingUsb: true, error: null });

    try {
      const port = await nav.serial.requestPort({});
      await port.open({ baudRate: 9600 });
      set({
        connectedUsbPort: port,
        connectedUsbDevice: null,
        usbInterfaceNumber: null,
        usbEndpointOut: null,
        isConnectingUsb: false,
        error: null,
      });
    } catch (err) {
      console.error('USB connection failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal terhubung ke printer USB.';
      set({
        isConnectingUsb: false,
        error: errorMsg,
      });
      throw err;
    }
  },

  connectWebUsbPrinter: async () => {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as NavigatorWithBluetoothSerialAndUsb) : null;
    if (!nav || !nav.usb) {
      set({ error: 'Browser ini tidak mendukung WebUSB API.' });
      throw new Error('WebUSB tidak didukung.');
    }

    set({ isConnectingUsb: true, error: null });

    try {
      const device = await nav.usb.requestDevice({
        filters: [{ interfaceClass: 7 }] // Direct target for USB Printing Support class
      });

      await device.open();
      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      // Discover interface number and endpoint out dynamically
      let interfaceNumber: number | null = null;
      let endpointOut: number | null = null;

      for (const config of device.configurations) {
        for (const iface of config.interfaces) {
          for (const alt of iface.alternates) {
            if (alt.interfaceClass === 7) {
              interfaceNumber = iface.interfaceNumber;
              for (const ep of alt.endpoints) {
                if (ep.direction === 'out' && ep.type === 'bulk') {
                  endpointOut = ep.endpointNumber;
                  break;
                }
              }
            }
            if (endpointOut !== null) break;
          }
          if (endpointOut !== null) break;
        }
        if (endpointOut !== null) break;
      }

      // Fallback search for any bulk output endpoint if class 7 discovery failed
      if (endpointOut === null) {
        for (const config of device.configurations) {
          for (const iface of config.interfaces) {
            for (const alt of iface.alternates) {
              for (const ep of alt.endpoints) {
                if (ep.direction === 'out' && ep.type === 'bulk') {
                  interfaceNumber = iface.interfaceNumber;
                  endpointOut = ep.endpointNumber;
                  break;
                }
              }
              if (endpointOut !== null) break;
            }
            if (endpointOut !== null) break;
          }
          if (endpointOut !== null) break;
        }
      }

      if (interfaceNumber === null || endpointOut === null) {
        throw new Error('Tidak dapat menemukan antarmuka/endpoint cetak bulk-out pada perangkat USB.');
      }

      await device.claimInterface(interfaceNumber);

      set({
        connectedUsbDevice: device,
        usbInterfaceNumber: interfaceNumber,
        usbEndpointOut: endpointOut,
        connectedUsbPort: null, // clear serial if any
        isConnectingUsb: false,
        error: null,
      });
    } catch (err) {
      console.error('WebUSB connection failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal terhubung ke printer WebUSB.';
      set({
        isConnectingUsb: false,
        error: errorMsg,
      });
      throw err;
    }
  },

  disconnectUsbPrinter: async () => {
    const { connectedUsbPort, connectedUsbDevice, usbInterfaceNumber } = get();
    
    if (connectedUsbPort) {
      try {
        await connectedUsbPort.close();
      } catch (err) {
        console.error('Error closing Serial port:', err);
      }
    }

    if (connectedUsbDevice) {
      try {
        if (usbInterfaceNumber !== null) {
          await connectedUsbDevice.releaseInterface(usbInterfaceNumber);
        }
        await connectedUsbDevice.close();
      } catch (err) {
        console.error('Error closing WebUSB device:', err);
      }
    }

    set({
      connectedUsbPort: null,
      connectedUsbDevice: null,
      usbInterfaceNumber: null,
      usbEndpointOut: null,
      error: null,
    });
  },

  printViaUsb: async (rawBytes: Uint8Array) => {
    const { connectedUsbPort, connectedUsbDevice, usbEndpointOut } = get();
    if (!connectedUsbPort && !connectedUsbDevice) {
      set({ error: 'Printer USB tidak terhubung.' });
      throw new Error('Printer USB tidak terhubung.');
    }

    try {
      if (connectedUsbPort) {
        const writer = connectedUsbPort.writable.getWriter();
        await writer.write(rawBytes);
        writer.releaseLock();
      } else if (connectedUsbDevice && usbEndpointOut !== null) {
        await connectedUsbDevice.transferOut(usbEndpointOut, rawBytes as any);
      }
    } catch (err) {
      console.error('USB printing failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal mencetak via USB.';
      set({ error: errorMsg });
      throw err;
    }
  },

  printReceipt: async (transaction, storeName, outletName, cashierName, paperWidth) => {
    const { printerCharacteristic, connectedUsbPort, connectedUsbDevice, usbEndpointOut } = get();
    if (!printerCharacteristic && !connectedUsbPort && !connectedUsbDevice) {
      set({ error: 'Printer tidak terhubung.' });
      throw new Error('Printer tidak terhubung.');
    }

    try {
      const payload = buildReceiptPayload(transaction, storeName, outletName, cashierName, paperWidth);

      if (connectedUsbPort) {
        const writer = connectedUsbPort.writable.getWriter();
        await writer.write(payload);
        writer.releaseLock();
        return;
      }

      if (connectedUsbDevice && usbEndpointOut !== null) {
        await connectedUsbDevice.transferOut(usbEndpointOut, payload as any);
        return;
      }

      // Write in chunked mode (max 20 bytes per write)
      const CHUNK_SIZE = 20;
      for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
        const chunk = payload.slice(i, i + CHUNK_SIZE);

        if (typeof printerCharacteristic!.writeValueWithoutResponse === 'function') {
          await printerCharacteristic!.writeValueWithoutResponse(chunk);
        } else if (typeof printerCharacteristic!.writeValueWithResponse === 'function') {
          await printerCharacteristic!.writeValueWithResponse(chunk);
        } else if (typeof printerCharacteristic!.writeValue === 'function') {
          await printerCharacteristic!.writeValue(chunk);
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
  printViaRawBt: (rawBytes: Uint8Array) => {
    try {
      let base64Data = '';
      if (typeof Buffer !== 'undefined') {
        base64Data = Buffer.from(rawBytes).toString('base64');
      } else {
        let binary = '';
        const len = rawBytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(rawBytes[i]);
        }
        base64Data = btoa(binary);
      }
      window.location.href = `rawbt://base64,${base64Data}`;
    } catch (err) {
      console.error('RawBT printing failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim data ke RawBT.';
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

    // USB additions
    connectedUsbPort: store.connectedUsbPort,
    isConnectingUsb: store.isConnectingUsb,
    connectUsbPrinter: store.connectUsbPrinter,
    disconnectUsbPrinter: store.disconnectUsbPrinter,
    printViaUsb: store.printViaUsb,

    // WebUSB additions
    connectedUsbDevice: store.connectedUsbDevice,
    usbInterfaceNumber: store.usbInterfaceNumber,
    usbEndpointOut: store.usbEndpointOut,
    connectWebUsbPrinter: store.connectWebUsbPrinter,

    printReceipt: store.printReceipt,
    printViaRawBt: store.printViaRawBt,
  };
}
