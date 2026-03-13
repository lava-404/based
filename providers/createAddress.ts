import { BitGo } from 'bitgo'
async function createAddress(): Promise<void> {
    const bitgo = new BitGo({
      accessToken: process.env.BITGO_ACCESS_TOKEN || '',
      env: 'test'
    });
  
    const wallet = await bitgo.coin('eth').wallets().get({ id: 'wallet_id' });
    const address = await wallet.createAddress();
    
    console.log(address.address);
    console.log('Done!');
  }

  