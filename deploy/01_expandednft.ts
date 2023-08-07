module.exports = async ({ getNamedAccounts, deployments }: any ) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("ExpandedNFT", {
    from: deployer,
    log: true,
  });
};

module.exports.tags = ["ExpandedNFT"];
