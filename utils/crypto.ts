import CryptoJS from "crypto-js";

interface Payload {
  v: 1;
  salt: string;
  iv: string;
  data: string;
  mac: string;
}

export function encryptText(text: string, secret: string): string {
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);

  const key = CryptoJS.PBKDF2(secret, salt, {
    keySize: 256 / 32,
    iterations: 150_000,
  });

  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // 🔐 Integrity protection
  const mac = CryptoJS.HmacSHA256(
    encrypted.ciphertext.toString(),
    key
  ).toString();

  const payload: Payload = {
    v: 1,
    salt: salt.toString(),
    iv: iv.toString(),
    data: encrypted.ciphertext.toString(),
    mac,
  };

  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function decryptText(encoded: string, secret: string): string | null {
  try {
    const json = Buffer.from(encoded, "base64").toString("utf8");
    const payload = JSON.parse(json) as Payload;

    const salt = CryptoJS.enc.Hex.parse(payload.salt);
    const iv = CryptoJS.enc.Hex.parse(payload.iv);

    const key = CryptoJS.PBKDF2(secret, salt, {
      keySize: 256 / 32,
      iterations: 150_000,
    });

    // 🔎 Verify integrity
    const expectedMac = CryptoJS.HmacSHA256(payload.data, key).toString();
    if (expectedMac !== payload.mac) return null;

    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Hex.parse(payload.data) } as any,
      key,
      {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8) || null;
  } catch {
    return null;
  }
}
