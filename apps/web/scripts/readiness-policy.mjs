export function databaseCoverageReady({ markets, common, roles }) {
  return markets.some(market => market.code === "PT") && common >= 20 &&
    roles.length > 0 && roles.every(role => role.complete);
}
