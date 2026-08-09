import { useState, useEffect, useCallback } from 'react';

export interface ZebraDevice {
  name: string;
  uid: string;
  connection: string;
  deviceType: string;
  version?: number;
  apiLevel?: number;
}

export interface ZebraPrintState {
  isSupported: boolean; // Is localhost print endpoint reachable
  isConnecting: boolean;
  connectedDevice: ZebraDevice | null;
  availableDevices: ZebraDevice[];
  error: string | null;
}

export function useZebraPrint() {
  const [state, setState] = useState<ZebraPrintState>({
    isSupported: false,
    isConnecting: false,
    connectedDevice: null,
    availableDevices: [],
    error: null,
  });

  const getPorts = () => {
    // If the website is loaded over HTTPS, we must use secure WebSocket / API port 9101.
    // Standard HTTP works on port 9100.
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    return isHttps ? ['https://localhost:9101', 'http://localhost:9100'] : ['http://localhost:9100', 'https://localhost:9101'];
  };

  const connectToZebra = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    const ports = getPorts();
    let connected = false;
    let defaultDevice: ZebraDevice | null = null;
    let errorMsg: string | null = null;

    for (const baseUrl of ports) {
      try {
        const response = await fetch(`${baseUrl}/default?type=printer`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
        });

        if (response.ok) {
          const text = await response.text();
          if (!text || text.trim() === '') {
            continue;
          }

          try {
            const parsed = JSON.parse(text);
            if (typeof parsed === 'object' && parsed !== null) {
              defaultDevice = {
                name: parsed.name || 'Zebra Printer',
                uid: parsed.uid || parsed.name || 'default_zebra',
                connection: parsed.connection || 'usb',
                deviceType: parsed.deviceType || 'printer',
                version: parsed.version,
                apiLevel: parsed.apiLevel,
              };
            } else if (typeof parsed === 'string') {
              defaultDevice = {
                name: parsed,
                uid: parsed,
                connection: 'usb',
                deviceType: 'printer',
              };
            }
          } catch {
            const cleanText = text.replace(/^"|"$/g, '').trim();
            defaultDevice = {
              name: cleanText || 'Zebra Printer',
              uid: cleanText || 'default_zebra',
              connection: 'usb',
              deviceType: 'printer',
            };
          }

          connected = true;
          break; // Found working service
        }
      } catch (err: any) {
        // Fallback to next port
        errorMsg = err.message || 'Connection failed';
      }
    }

    if (connected && defaultDevice) {
      // Try to get other available devices
      let devicesList: ZebraDevice[] = [defaultDevice];
      for (const baseUrl of ports) {
        try {
          const response = await fetch(`${baseUrl}/available?type=printer`, {
            method: 'GET',
            mode: 'cors',
          });
          if (response.ok) {
            const resText = await response.text();
            const parsedList = JSON.parse(resText);
            const printers = parsedList.printer || (Array.isArray(parsedList) ? parsedList : []);
            if (printers.length > 0) {
              devicesList = printers.map((p: any) => ({
                name: p.name || 'Zebra Device',
                uid: p.uid || p.name || 'uid_zebra',
                connection: p.connection || 'usb',
                deviceType: p.deviceType || 'printer',
              }));
            }
            break;
          }
        } catch {
          // Keep default printer list
        }
      }

      setState({
        isSupported: true,
        isConnecting: false,
        connectedDevice: defaultDevice,
        availableDevices: devicesList,
        error: null,
      });
      return true;
    } else {
      setState({
        isSupported: false,
        isConnecting: false,
        connectedDevice: null,
        availableDevices: [],
        error: 'Zebra Browser Print service not detected on this machine.',
      });
      return false;
    }
  }, []);

  const selectPrinter = useCallback((printerName: string) => {
    setState((prev) => {
      const found = prev.availableDevices.find((d) => d.name === printerName);
      if (found) {
        return { ...prev, connectedDevice: found };
      }
      return prev;
    });
  }, []);

  const printZpl = useCallback(async (zplString: string): Promise<{ success: boolean; error: string | null }> => {
    const ports = getPorts();
    const currentDevice = state.connectedDevice;

    if (!currentDevice) {
      return { success: false, error: 'No Zebra printer connected. Ensure Browser Print is running.' };
    }

    let printed = false;
    let lastError: string | null = null;

    for (const baseUrl of ports) {
      try {
        const payload = {
          device: {
            name: currentDevice.name,
            uid: currentDevice.uid,
            connection: currentDevice.connection,
            deviceType: currentDevice.deviceType,
            version: currentDevice.version || 3,
            apiLevel: currentDevice.apiLevel || 1,
          },
          data: zplString,
        };

        const response = await fetch(`${baseUrl}/write`, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload),
          mode: 'cors',
        });

        if (response.ok) {
          printed = true;
          break;
        } else {
          lastError = `Printer service error: ${response.status} ${response.statusText}`;
        }
      } catch (err: any) {
        lastError = err.message || 'Failed to send print command.';
      }
    }

    if (printed) {
      return { success: true, error: null };
    } else {
      return { success: false, error: lastError || 'Printer write failed.' };
    }
  }, [state.connectedDevice]);

  // Connect on mount
  useEffect(() => {
    connectToZebra();
  }, [connectToZebra]);

  return {
    ...state,
    retryConnection: connectToZebra,
    selectPrinter,
    printZpl,
  };
}
