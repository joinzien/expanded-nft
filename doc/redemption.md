# Redemption

1. The collector pay the platform wallet to redeem.
2. The platform calls `productionStart`.
3. The platform calls `productionComplete` to mark the work has finished, adding the condition report and updated metadata. Marking that edition as redeemed and switching to display the redeemed version.
