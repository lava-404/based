// services/bitgo.ts

import { BitGoAPI } from "@bitgo/sdk-api";
import { Eth } from "@bitgo/sdk-coin-eth";

const BITGO_ACCESS_TOKEN = process.env.BITGO_ACCESS_TOKEN || "";
const WALLET_PASSPHRASE =
  process.env.BITGO_WALLET_PASSPHRASE || "auction-passphrase";

const COIN = "tbaseeth";

let _sdk: BitGoAPI | null = null;
let _unlockExpires = 0;

export function getSdk(): BitGoAPI {
  if (_sdk) return _sdk;

  _sdk = new BitGoAPI({
    accessToken: BITGO_ACCESS_TOKEN,
    env: "test",
  });

  _sdk.register(COIN, Eth.createInstance);
  return _sdk;
}

export async function ensureUnlocked() {
  if (Date.now() < _unlockExpires) return;

  const sdk = getSdk();

  await sdk.unlock({
    otp: "000000",
    duration: 3600,
  });

  _unlockExpires = Date.now() + 50 * 60 * 1000;
}