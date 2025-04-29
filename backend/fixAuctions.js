import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Auction from './models/Auction.js';
import User from './models/User.js';

dotenv.config();

// Function to fix auctions without sellers
async function fixAuctions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');

    // Find an admin user to set as default seller
    let defaultSeller = await User.findOne({ role: 'admin' });
    
    // If no admin user is found, use the first user available
    if (!defaultSeller) {
      defaultSeller = await User.findOne();
      
      if (!defaultSeller) {
        console.error('❌ No users found in the database to use as default seller');
        await mongoose.disconnect();
        process.exit(1);
      }
    }

    console.log(`Using user "${defaultSeller.name}" (${defaultSeller._id}) as default seller`);

    // Find all auctions without a seller
    const auctionsQuery = { seller: { $exists: false } };
    const auctionsCount = await Auction.countDocuments(auctionsQuery);
    
    console.log(`Found ${auctionsCount} auctions missing seller field`);

    if (auctionsCount > 0) {
      // Update all auctions without a seller
      const result = await Auction.updateMany(
        auctionsQuery,
        { $set: { seller: defaultSeller._id } }
      );

      console.log(`✅ Fixed ${result.modifiedCount} auctions by setting default seller`);
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
    // Exit the process properly to avoid calling any interval functions
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing auctions:', error);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect error
    }
    process.exit(1);
  }
}

// Run the function
fixAuctions(); 