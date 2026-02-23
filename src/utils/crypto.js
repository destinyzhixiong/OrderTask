/**
 * 对称加密工具 - 与后端crypto_utils.py对应
 */
import CryptoJS from 'crypto-js'

function getKey(keyStr) {
  // 使用SHA256生成密钥（32字节的十六进制字符串）
  return CryptoJS.SHA256(keyStr)
}

export function encryptData(data, keyStr) {
  const key = getKey(keyStr)
  const iv = CryptoJS.lib.WordArray.random(16)
  
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  
  const ivBase64 = CryptoJS.enc.Base64.stringify(iv)
  const ctBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64)
  
  return ivBase64 + ':' + ctBase64
}

export function decryptData(encryptedData, keyStr) {
  const [ivBase64, ctBase64] = encryptedData.split(':')
  
  const key = getKey(keyStr)
  const iv = CryptoJS.enc.Base64.parse(ivBase64)
  const ct = CryptoJS.enc.Base64.parse(ctBase64)
  
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: ct
  })
  
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  
  return decrypted.toString(CryptoJS.enc.Utf8)
}

