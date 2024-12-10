import { existsSync } from 'fs';
import { join } from 'path';
import Memory from './memory';
import * as wasmModule from './wasm';
import { Secp256k1WASM } from './types.js';

declare const __dirname: string;
declare const process: any;
declare const require: any;

let wasmPath = './wasm_path.js';
let wasmInstance: WebAssembly.Instance;
let memoryInstance: Memory;

export function getWasmInstance(): WebAssembly.Instance {
  if (wasmInstance) return wasmInstance;
  
  let wasmBinary: Buffer | Uint8Array;
  
  if (typeof process === 'object' && typeof require === 'function') {
    // Node.js environment
    const wasmFile = join(__dirname, '../secp256k1.wasm');
    if (!existsSync(wasmFile)) {
      throw new Error('WASM binary not found');
    }
    wasmBinary = require('fs').readFileSync(wasmFile);
  } else {
    // Browser environment
    throw new Error('Browser environment not supported yet');
  }

  const memory = new WebAssembly.Memory({
    initial: 17,
    maximum: 100,
    shared: false
  });

  const importObject = {
    env: {
      memory
    }
  };

  const wasmModule = new WebAssembly.Module(wasmBinary);
  wasmInstance = new WebAssembly.Instance(wasmModule, importObject);
  
  memoryInstance = new Memory(wasmInstance.exports as unknown as Secp256k1WASM);
  
  return wasmInstance;
}

export function initWasm(): Secp256k1WASM {
  const instance = getWasmInstance();
  return instance.exports as unknown as Secp256k1WASM;
}
