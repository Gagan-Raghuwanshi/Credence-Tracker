import mongoose from "mongoose";
import crypto from "crypto";
const { Schema } = mongoose;

// Encryption key (32 bytes for AES-256)
const encryptionKey = "this3is0a732]byteA@*%_/\`=;AES2`!"; // Exactly 32 bytes

// Function to encrypt password
const encrypt = (password) => {
  const iv = crypto.randomBytes(16); // Generate a random 16-byte IV
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'utf-8'), iv);
  let encrypted = cipher.update(password, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Return IV and encrypted password
};

// Function to decrypt password
const decrypt = (encryptedPassword) => {
  const [iv, encryptedText] = encryptedPassword.split(':'); // Separate IV and encrypted text
  if (!iv || !encryptedText) {
    throw new Error('Invalid encrypted data format');
  }

  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'utf-8'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
};

const shareDeviceSchema = new Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  deviceId: {
    type: String,
  },
  expiration: {
    type: Date,
    index: { expires: 0 },
  },
});

// Pre-save middleware to encrypt password before saving
shareDeviceSchema.pre('save', function (next) {
  if (this.isModified('password') || this.isNew) {
    this.password = encrypt(this.password); // Encrypt password
  }
  next();
});
// Instance method to decrypt password
shareDeviceSchema.methods.decryptPassword = function () {
  return decrypt(this.password); // Decrypt the stored password
};

// Static method to find and decrypt password
shareDeviceSchema.statics.findAndDecrypt = async function (id) {
  const device = await this.findById(id);
  if (!device) {
    throw new Error('Device not found');
  }
  const decryptedPassword = device.decryptPassword();
  return decryptedPassword;
};

export const ShareDevice = mongoose.model("ShareDevice", shareDeviceSchema);
