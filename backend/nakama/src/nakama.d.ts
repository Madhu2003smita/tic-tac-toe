declare namespace nkruntime {
  interface Context {
    userId: string;
    username: string;
    matchId?: string;
  }

  interface Logger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
  }

  interface MatchDispatcher {
    broadcastMessage(opCode: number, data: string, presences?: Presence[] | null, sender?: Presence | null): void;
  }

  interface Presence {
    userId: string;
    sessionId: string;
    username: string;
    node: string;
  }

  interface MatchMessage {
    sender: Presence;
    data: string;
    opCode: number;
  }

  interface MatchListing {
    matchId: string;
    authoritative: boolean;
    label: string;
    size: number;
  }

  interface StorageObject {
    collection: string;
    key: string;
    userId: string;
    value: any;
    version?: string;
    permissionRead?: number;
    permissionWrite?: number;
  }

  interface Nakama {
    matchCreate(module: string, params?: any): string;
    matchList(limit: number, authoritative: boolean, label: string, minSize: number, maxSize: number, query: string): MatchListing[];
    storageRead(reads: Array<{ collection: string; key: string; userId: string }>): StorageObject[];
    storageWrite(writes: StorageObject[]): void;
  }

  interface Initializer {
    registerMatch(name: string, handlers: {
      matchInit: any;
      matchJoinAttempt: any;
      matchJoin: any;
      matchLeave: any;
      matchLoop: any;
      matchTerminate: any;
      matchSignal: any;
    }): void;
    registerRpc(id: string, fn: (ctx: Context, logger: Logger, nk: Nakama, payload: string) => string): void;
  }
}
