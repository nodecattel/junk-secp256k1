import Memory from './memory';
import * as wasm from './wasm';
import { Secp256k1WASM } from './types';

let wasmInstance: WebAssembly.Instance;
let memoryInstance: Memory;

export function getWasmInstance(): WebAssembly.Instance {
  if (wasmInstance) return wasmInstance;

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

  wasmInstance = new WebAssembly.Instance(wasm as any, importObject);
  memoryInstance = new Memory(wasmInstance.exports as unknown as Secp256k1WASM);
  
  return wasmInstance;
}

export function initWasm(): Secp256k1WASM {
  const instance = getWasmInstance();
  return instance.exports as unknown as Secp256k1WASM;
}
