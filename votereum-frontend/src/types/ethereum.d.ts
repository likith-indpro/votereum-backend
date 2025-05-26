interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (
      eventName: string,
      callback: (...args: any[]) => void
    ) => void;
    selectedAddress?: string;
    chainId?: string;
    isConnected?: () => boolean;
    enable?: () => Promise<string[]>; // Legacy method
    networkVersion?: string;
    _metamask?: {
      isUnlocked: () => Promise<boolean>;
    };
  };
}
