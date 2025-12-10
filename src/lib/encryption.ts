/**
 * Encryption utility for the Bioelectric Regeneration Tracker
 * 
 * This file contains functions for encrypting and decrypting sensitive data
 * such as journal entries to ensure user privacy and data security.
 */

import CryptoJS from 'crypto-js';

/**
 * Encrypts content using AES encryption
 * 
 * @param content - The plain text content to encrypt
 * @returns The encrypted content as a string
 */
export const encryptEntry = (content: string): string => {
  try {
    // In a production app, you would get this from a secure environment variable
    // or user-specific key derivation
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'bioelectric-regeneration-secure-key';
    
    // Encrypt the content using AES
    const encrypted = CryptoJS.AES.encrypt(content, encryptionKey).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    // Return original content if encryption fails
    // In production, you might want to handle this differently
    return content;
  }
};

/**
 * Decrypts content that was encrypted with AES
 * 
 * @param encryptedContent - The encrypted content string
 * @returns The decrypted plain text content
 */
export const decryptEntry = (encryptedContent: string): string => {
  try {
    // Use the same key as for encryption
    const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'bioelectric-regeneration-secure-key';
    
    // Decrypt the content
    const decrypted = CryptoJS.AES.decrypt(encryptedContent, encryptionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Return original content if decryption fails
    // This could happen if the content wasn't actually encrypted
    return encryptedContent;
  }
};

/**
 * Creates a secure hash of content (e.g., for comparison without decryption)
 * 
 * @param content - The content to hash
 * @returns SHA-256 hash of the content
 */
export const hashContent = (content: string): string => {
  return CryptoJS.SHA256(content).toString();
};

/**
 * Generates a random encryption key that can be used for client-side encryption
 * 
 * @returns A random encryption key string
 */
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

/**
 * Securely stores an encryption key in local storage with expiration
 * 
 * @param key - The key identifier
 * @param value - The encryption key to store
 * @param expirationHours - Number of hours until the key expires
 */
export const storeEncryptionKey = (
  key: string, 
  value: string, 
  expirationHours: number = 24
): void => {
  const expirationMs = expirationHours * 60 * 60 * 1000;
  const expirationTime = new Date().getTime() + expirationMs;
  
  const item = {
    value,
    expiration: expirationTime
  };
  
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * Retrieves an encryption key from local storage if it hasn't expired
 * 
 * @param key - The key identifier
 * @returns The stored encryption key or null if expired/not found
 */
export const getStoredEncryptionKey = (key: string): string | null => {
  const itemStr = localStorage.getItem(key);
  
  if (!itemStr) {
    return null;
  }
  
  try {
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();
    
    // Check if the item has expired
    if (now > item.expiration) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  } catch (error) {
    console.error('Error retrieving stored encryption key:', error);
    return null;
  }
};
