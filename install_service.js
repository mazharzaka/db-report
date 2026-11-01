import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure the Native Windows Service
const svc = new Service({
  name: 'DreamPark_Caravan_Report',
  description: 'Dream Park ERP - Caravan Revenues & Sales Reporting Background Service (Standalone)',
  script: path.join(__dirname, 'server.js'),
  env: [
    {
      name: 'NODE_ENV',
      value: 'production'
    },
    {
      name: 'PORT',
      value: '5000'
    }
  ],
  // Keep-alive and automatic restart configuration
  wait: 2,
  grow: 0.5,
  maxRetries: 10,
  maxRestarts: 10
});

// Event Handlers
svc.on('install', () => {
  console.log('\n========================================================');
  console.log('✅ Windows Service installed successfully!');
  console.log('📌 Service Name:   "DreamPark_Caravan_Report"');
  console.log('📁 Script Target:  ' + path.join(__dirname, 'server.js'));
  console.log('🚀 Starting service now...');
  console.log('========================================================\n');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.warn('\n⚠️ Service "DreamPark_Caravan_Report" is already installed on this system.');
  console.log('👉 To reinstall or restart, run: node uninstall_service.js first.\n');
});

svc.on('start', () => {
  console.log('✨ Service "DreamPark_Caravan_Report" is running.');
  console.log('🛡️ Configured to start automatically on Windows boot.');
  console.log('🔄 Automatic keep-alive and crash recovery enabled.');
});

svc.on('error', (err) => {
  console.error('\n❌ Service installation encountered an error:', err);
});

console.log('⏳ Registering Windows Service: "DreamPark_Caravan_Report"...');
console.log('🔒 Ensure this script is running with Administrator privileges.\n');
svc.install();
