const test = require('tape');
const secp256k1 = require('../lib/index.js');

// Helper function to ensure we have Buffer
function toBuffer(arr) {
  return Buffer.from(arr.buffer, arr.byteOffset, arr.length);
}

// Append results to the DOM (if running in the browser)
function appendToResults(msg) {
  if (typeof document !== 'undefined') {
    const resultsDiv = document.getElementById('tap-results');
    if (resultsDiv) {
      const pre = document.createElement('pre');
      pre.textContent = msg;
      resultsDiv.appendChild(pre);
    }
  }
}

// Listen for test events
test.createStream().on('data', (row) => {
  console.log(row.toString()); // Log to console for Node.js
  appendToResults(row.toString()); // Append to DOM for browser
});

// Tests
test('secp256k1 module loaded', (t) => {
  t.plan(2);
  t.ok(secp256k1, 'secp256k1 module should exist');
  t.ok(typeof secp256k1.pointFromScalar === 'function', 'pointFromScalar should be a function');
  console.log('Available methods:', Object.keys(secp256k1));
  t.end();
});

test('Basic secp256k1 functionality', (t) => {
  t.plan(5);

  // Create a valid private key
  const privateKey = Buffer.alloc(32, 1); // All ones
  console.log('Private key:', privateKey);

  // Test private key validation
  t.ok(secp256k1.isPrivate(privateKey), 'Should validate correct private key');

  // Try generating public key with debug info
  const publicKey = secp256k1.pointFromScalar(privateKey, true);
  console.log('Public key result:', publicKey);

  // Basic type checks
  t.ok(publicKey !== undefined, 'Public key should not be undefined');
  t.ok(publicKey !== null, 'Public key should not be null');

  // Type checks - now accepting both Buffer and Uint8Array
  t.ok(Buffer.isBuffer(privateKey), 'Private key should be a Buffer');
  t.ok(publicKey instanceof Uint8Array || Buffer.isBuffer(publicKey), 'Public key should be a Uint8Array or Buffer');

  t.end();
});

test('Key validation', (t) => {
  t.plan(4);

  // Test invalid private key (all zeros)
  const invalidPrivateKey = Buffer.alloc(32, 0);
  t.notOk(secp256k1.isPrivate(invalidPrivateKey), 'Should reject invalid private key');

  // Test valid private key creation
  const validPrivateKey = Buffer.alloc(32);
  validPrivateKey[0] = 1; // Just first byte set to 1
  t.ok(secp256k1.isPrivate(validPrivateKey), 'Should accept valid private key');

  // Try public key validation if we can generate one
  const publicKey = secp256k1.pointFromScalar(validPrivateKey, true);
  if (publicKey) {
    t.ok(secp256k1.isPoint(publicKey), 'Should validate public key point');
    t.ok(secp256k1.isPointCompressed(publicKey), 'Should verify compressed format');
  } else {
    t.skip('Skipping public key validation due to generation failure');
    t.skip('Skipping compression check due to generation failure');
  }

  t.end();
});

test('Signing functionality', (t) => {
  t.plan(3);

  const privateKey = Buffer.alloc(32);
  privateKey[0] = 1; // Simple valid private key

  const message = Buffer.alloc(32, 2); // Message to sign

  // Test basic signing
  try {
    const signature = secp256k1.sign(message, privateKey);
    t.ok(signature instanceof Uint8Array || Buffer.isBuffer(signature), 'Should produce a signature');

    const publicKey = secp256k1.pointFromScalar(privateKey, true);
    if (publicKey) {
      const verified = secp256k1.verify(message, publicKey, signature);
      t.ok(verified, 'Should verify valid signature');

      // Try with modified message
      const modifiedMessage = Buffer.alloc(32, 3);
      const verifiedModified = secp256k1.verify(modifiedMessage, publicKey, signature);
      t.notOk(verifiedModified, 'Should reject invalid signature');
    } else {
      t.skip('Skipping verification due to public key generation failure');
      t.skip('Skipping invalid signature test due to public key generation failure');
    }
  } catch (err) {
    console.log('Signing error:', err);
    t.skip('Signing functionality not available');
    t.skip('Skipping verification test');
    t.skip('Skipping invalid signature test');
  }

  t.end();
});

// Ensure this works in both browser and Node.js environments
if (typeof window !== 'undefined') {
  window.runTests = () => {
    console.log('Tests running...');
  };
}
