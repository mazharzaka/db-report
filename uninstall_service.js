import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the Windows Service for uninstallation
const svc = new Service({
  name: 'DreamPark_Caravan_Report',
  script: path.join(__dirname, 'server.js')
});

// Event Handlers
svc.on('uninstall', () => {
  console.log('\n========================================================');
  console.log('✅ Service "DreamPark_Caravan_Report" uninstalled successfully.');
  console.log('🛑 The background Windows Service has been stopped and removed.');
  console.log('========================================================\n');
});

svc.on('alreadyuninstalled', () => {
  console.log('\nℹ️ Service "DreamPark_Caravan_Report" is not currently installed.\n');
});

svc.on('error', (err) => {
  console.error('\n❌ Service uninstallation error:', err);
});

console.log('⏳ Removing Windows Service: "DreamPark_Caravan_Report"...');
console.log('🔒 Ensure this script is running with Administrator privileges.\n');
svc.uninstall();
