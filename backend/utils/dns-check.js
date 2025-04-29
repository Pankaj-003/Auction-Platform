import dns from 'dns';
import { promises as dnsPromises } from 'dns';

// Check MongoDB Atlas hostnames
const mongoHostnames = [
  'ac-hntey8o-shard-00-00.rooyb37.mongodb.net',
  'ac-hntey8o-shard-00-01.rooyb37.mongodb.net',
  'ac-hntey8o-shard-00-02.rooyb37.mongodb.net',
  'cluster0.rooyb37.mongodb.net'
];

console.log('Running MongoDB Atlas DNS connectivity check...\n');

// Run the hostname check for each MongoDB host
Promise.all(mongoHostnames.map(async (hostname) => {
  console.log(`Checking ${hostname}...`);
  
  try {
    const addresses = await dnsPromises.lookup(hostname, { all: true });
    console.log(`✅ Success: ${hostname} resolves to:`, addresses.map(a => a.address).join(', '));
    return { hostname, success: true, addresses };
  } catch (error) {
    console.log(`❌ Failed: ${hostname} - ${error.message}`);
    return { hostname, success: false, error: error.message };
  }
}))
.then(results => {
  const failed = results.filter(r => !r.success);
  
  console.log('\n=== DNS Check Summary ===');
  console.log(`Total hosts checked: ${results.length}`);
  console.log(`Successful: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\nPossible solutions:');
    console.log('1. Check your internet connection');
    console.log('2. Try using a VPN or different network');
    console.log('3. Use the direct IP connection string in your MONGO_URI');
    console.log('4. Check if your MongoDB Atlas cluster is still active');
    console.log('5. Ensure no firewall is blocking outbound connections');
  }
})
.catch(err => {
  console.error('Error running DNS checks:', err);
}); 