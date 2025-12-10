declare module 'ws' {
  import { EventEmitter } from 'events';
  import { IncomingMessage } from 'http';
  import { Duplex } from 'stream';

  class WebSocket extends EventEmitter {
    static readonly CONNECTING: number;
    static readonly OPEN: number;
    static readonly CLOSING: number;
    static readonly CLOSED: number;

    binaryType: string;
    readonly bufferedAmount: number;
    readonly extensions: string;
    readonly protocol: string;
    readonly readyState: number;
    readonly url: string;

    constructor(
      address: string | URL,
      protocols?: string | string[],
      options?: WebSocket.ClientOptions
    );

    close(code?: number, data?: string | Buffer): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, cb?: (err?: Error) => void): void;
    send(
      data: any,
      options: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean },
      cb?: (err?: Error) => void
    ): void;

    terminate(): void;

    on(event: 'close', listener: (code: number, reason: string) => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'message', listener: (data: WebSocket.Data) => void): this;
    on(event: 'open', listener: () => void): this;
    on(event: 'ping' | 'pong', listener: (data: Buffer) => void): this;
    on(event: 'unexpected-response', listener: (request: any, response: any) => void): this;
    on(event: 'upgrade', listener: (response: IncomingMessage) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  namespace WebSocket {
    type Data = string | Buffer | ArrayBuffer | Buffer[];

    interface ClientOptions {
      followRedirects?: boolean;
      handshakeTimeout?: number;
      maxPayload?: number;
      maxRedirects?: number;
      origin?: string;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      protocolVersion?: number;
      skipUTF8Validation?: boolean;
    }

    interface PerMessageDeflateOptions {
      clientMaxWindowBits?: number;
      clientNoContextTakeover?: boolean;
      concurrencyLimit?: number;
      serverMaxWindowBits?: number;
      serverNoContextTakeover?: boolean;
      threshold?: number;
      zlibDeflateOptions?: {
        chunkSize?: number;
        level?: number;
        memLevel?: number;
        strategy?: number;
        windowBits?: number;
      };
      zlibInflateOptions?: {
        chunkSize?: number;
        windowBits?: number;
      };
    }

    interface ServerOptions {
      backlog?: number;
      clientTracking?: boolean;
      handleProtocols?: (protocols: string[], request: IncomingMessage) => string | false;
      host?: string;
      maxPayload?: number;
      noServer?: boolean;
      path?: string;
      perMessageDeflate?: boolean | PerMessageDeflateOptions;
      port?: number;
      server?: any;
      skipUTF8Validation?: boolean;
      verifyClient?: VerifyClientCallbackAsync | VerifyClientCallbackSync;
    }

    interface VerifyClientCallbackAsync {
      (
        info: { origin: string; secure: boolean; req: IncomingMessage },
        callback: (res: boolean, code?: number, message?: string, headers?: object) => void
      ): void;
    }

    interface VerifyClientCallbackSync {
      (info: { origin: string; secure: boolean; req: IncomingMessage }): boolean;
    }
  }

  class WebSocketServer extends EventEmitter {
    constructor(options?: WebSocket.ServerOptions, callback?: () => void);

    address(): { port: number; family: string; address: string };
    close(cb?: (err?: Error) => void): void;
    handleUpgrade(
      request: IncomingMessage,
      socket: Duplex,
      upgradeHead: Buffer,
      callback: (client: WebSocket, request: IncomingMessage) => void
    ): void;
    shouldHandle(request: IncomingMessage): boolean;

    on(event: 'close', listener: () => void): this;
    on(event: 'connection', listener: (socket: WebSocket, request: IncomingMessage) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'headers', listener: (headers: string[], request: IncomingMessage) => void): this;
    on(event: 'listening', listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
  }

  export = WebSocket;
  export { WebSocketServer };
}