import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Make sure environment variables are loaded
dotenv.config();

// Get dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if JWT_SECRET exists in .env, if not, create one
export const ensureJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET not found in environment variables. Setting a temporary one.');
    
    // Generate a secure random string for JWT_SECRET
    const randomSecret = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15) + 
                          Date.now().toString();
    
    process.env.JWT_SECRET = randomSecret;
    
    // Try to update the .env file if it exists
    const envPath = path.resolve(__dirname, '../.env');
    
    if (fs.existsSync(envPath)) {
      try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        if (envContent.includes('JWT_SECRET=')) {
          // Replace existing JWT_SECRET
          envContent = envContent.replace(
            /JWT_SECRET=.*/,
            `JWT_SECRET=${randomSecret}`
          );
        } else {
          // Add JWT_SECRET at the end
          envContent += `\nJWT_SECRET=${randomSecret}`;
        }
        
        fs.writeFileSync(envPath, envContent);
        console.log('JWT_SECRET has been added to .env file');
      } catch (err) {
        console.error('Error updating .env file:', err);
      }
    } else {
      console.warn('.env file not found. JWT_SECRET is set for this session only.');
    }
  }
  
  return process.env.JWT_SECRET;
};

// Generate a JWT token for a user
export const generateToken = (user) => {
  const secret = ensureJwtSecret();
  
  return jwt.sign(
    { 
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Verify a token and return the decoded data
export const verifyToken = (token) => {
  const secret = ensureJwtSecret();
  
  try {
    const decoded = jwt.verify(token, secret);
    
    // Handle both token formats (old and new)
    // Old tokens have userId, new tokens have id
    if (decoded.userId && !decoded.id) {
      decoded.id = decoded.userId;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification error in utility:', error.message);
    throw error; // Let the caller handle the error
  }
}; 