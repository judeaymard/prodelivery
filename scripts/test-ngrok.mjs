import { createRequire } from 'module';
const require = createRequire(import.meta.url);

async function test() {
  try {
    const ngrok = require('C:/Users/HP/AppData/Roaming/npm/node_modules/ngrok');
    console.log('Connecting ngrok to port 3000...');
    const url = await ngrok.connect(3000);
    console.log('NGROK_URL:', url);
  } catch (err) {
    console.error('Ngrok connect error:', err);
  }
}
test();
