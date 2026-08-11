interface AssetPayload {
  ticker: string;
  isin: string;
  name: string;
}

export function validateAssetIdentity(payload: AssetPayload, expectedIsin: string): boolean {
  if (payload.isin !== expectedIsin) {
    console.error(`Asset mismatch detected for ${payload.ticker}: ISIN ${payload.isin} != ${expectedIsin}`);
    return false;
  }
  return true;
}
