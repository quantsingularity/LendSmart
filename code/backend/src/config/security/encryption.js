const crypto = require("crypto");
const { promisify } = require("util");

/**
 * Enterprise-grade encryption utility for sensitive financial data
 * Implements AES-256-GCM encryption with proper key derivation
 */
class EncryptionService {
  constructor() {
    this.algorithm = "aes-256-gcm";
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.saltLength = 32; // 256 bits
    this.tagLength = 16; // 128 bits
    this.iterations = 100000; // PBKDF2 iterations

    // Master key from environment (should be 64 hex characters)
    this.masterKey = process.env.ENCRYPTION_MASTER_KEY;
    if (!this.masterKey || this.masterKey.length !== 64) {
      throw new Error("ENCRYPTION_MASTER_KEY must be 64 hex characters");
    }
  }

  /**
   * Derive encryption key from master key and salt using PBKDF2
   * @param {Buffer} salt - Random salt for key derivation
   * @returns {Buffer} Derived encryption key
   */
  async deriveKey(salt) {
    const pbkdf2 = promisify(crypto.pbkdf2);
    return await pbkdf2(
      this.masterKey,
      salt,
      this.iterations,
      this.keyLength,
      "sha512",
    );
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   * @param {string} plaintext - Data to encrypt
   * @param {string} context - Additional context for encryption (optional)
   * @returns {string} Base64 encoded encrypted data with metadata
   */
  async encrypt(plaintext, context = "") {
    try {
      // Generate random salt and IV
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);

      // Derive encryption key
      const key = await this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(context, "utf8"));

      // Encrypt data
      let encrypted = cipher.update(plaintext, "utf8");
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine all components
      const result = Buffer.concat([salt, iv, tag, encrypted]);

      return result.toString("base64");
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt data encrypted with encrypt method
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @param {string} context - Additional context used during encryption
   * @returns {string} Decrypted plaintext
   */
  async decrypt(encryptedData, context = "") {
    try {
      const data = Buffer.from(encryptedData, "base64");

      // Extract components
      const salt = data.slice(0, this.saltLength);
      const iv = data.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = data.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength,
      );
      const encrypted = data.slice(
        this.saltLength + this.ivLength + this.tagLength,
      );

      // Derive decryption key
      const key = await this.deriveKey(salt);

      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from(context, "utf8"));

      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString("utf8");
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash sensitive data for comparison (one-way)
   * @param {string} data - Data to hash
   * @param {string} salt - Optional salt (will generate if not provided)
   * @returns {Object} Hash and salt
   */
  hash(data, salt = null) {
    try {
      const actualSalt =
        salt || crypto.randomBytes(this.saltLength).toString("hex");
      const hash = crypto.pbkdf2Sync(
        data,
        actualSalt,
        this.iterations,
        this.keyLength,
        "sha512",
      );

      return {
        hash: hash.toString("hex"),
        salt: actualSalt,
      };
    } catch (error) {
      throw new Error(`Hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify hashed data
   * @param {string} data - Original data
   * @param {string} hash - Hash to verify against
   * @param {string} salt - Salt used for hashing
   * @returns {boolean} True if data matches hash
   */
  verifyHash(data, hash, salt) {
    try {
      const computed = this.hash(data, salt);
      return crypto.timingSafeEqual(
        Buffer.from(computed.hash, "hex"),
        Buffer.from(hash, "hex"),
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate cryptographically secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Hex encoded random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate secure API key
   * @returns {string} Base64 encoded API key
   */
  generateApiKey() {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(32);
    const combined = Buffer.concat([Buffer.from(timestamp), random]);
    return combined.toString("base64");
  }

  /**
   * Encrypt field-level data for database storage
   * @param {Object} data - Object with fields to encrypt
   * @param {Array} fieldsToEncrypt - Array of field names to encrypt
   * @returns {Object} Object with encrypted fields
   */
  async encryptFields(data, fieldsToEncrypt) {
    const result = { ...data };

    for (const field of fieldsToEncrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        result[field] = await this.encrypt(String(result[field]), field);
      }
    }

    return result;
  }

  /**
   * Decrypt field-level data from database
   * @param {Object} data - Object with encrypted fields
   * @param {Array} fieldsToDecrypt - Array of field names to decrypt
   * @returns {Object} Object with decrypted fields
   */
  async decryptFields(data, fieldsToDecrypt) {
    const result = { ...data };

    for (const field of fieldsToDecrypt) {
      if (result[field] !== undefined && result[field] !== null) {
        try {
          result[field] = await this.decrypt(result[field], field);
        } catch (error) {
          // Log error but don't fail the entire operation
          console.error(`Failed to decrypt field ${field}:`, error.message);
          result[field] = null;
        }
      }
    }

    return result;
  }
}

// Singleton instance
let encryptionService = null;

/**
 * Get encryption service instance
 * @returns {EncryptionService} Encryption service singleton
 */
function getEncryptionService() {
  if (!encryptionService) {
    encryptionService = new EncryptionService();
  }
  return encryptionService;
}

module.exports = {
  EncryptionService,
  getEncryptionService,
};
