import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const staffPath = path.join(__dirname, 'data', 'staff.json');

async function hashPassword() {
  // Read the staff.json file
  const staffData = JSON.parse(fs.readFileSync(staffPath, 'utf8'));
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);
  
  // Update the admin user
  const adminIndex = staffData.findIndex(user => user.username === 'admin');
  
  if (adminIndex !== -1) {
    staffData[adminIndex] = {
      ...staffData[adminIndex],
      password: hashedPassword
    };
  } else {
    // If admin user doesn't exist, create it
    staffData.push({
      id: Date.now(),
      username: 'admin',
      displayName: 'Administrator',
      password: hashedPassword,
      role: 'owner',
      dateAdded: new Date().toISOString()
    });
  }
  
  // Write the updated data back to staff.json
  fs.writeFileSync(staffPath, JSON.stringify(staffData, null, 2));
  
  console.log('Admin password updated successfully!');
}

// Run the function
hashPassword().catch(error => {
  console.error('Error updating admin password:', error);
});