import { expect } from "chai";
import { ethers } from "hardhat";

describe("Token Burn", function () {
  let auraToken: any;
  let ownerAddress: any;

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    const owner = signers[0];
    ownerAddress = await owner.getAddress();

    const AuraToken = await ethers.getContractFactory("AuraToken");
    auraToken = await AuraToken.deploy();
    await auraToken.deployed();
  });

  it("The owner should be able to burn tokens they own", async function () {
    expect(await auraToken.totalSupply()).to.equal(0);

    await auraToken.mint(ownerAddress, 1000);

    expect(await auraToken.totalSupply()).to.equal(1000);

    await auraToken.burn(1000, []);

    expect(await auraToken.totalSupply()).to.equal(0);
  });

  it("The owner should only be able to burn the number of tokens they own", async function () {
    expect(await auraToken.totalSupply()).to.equal(0);

    await auraToken.mint(ownerAddress, 1000);

    expect(await auraToken.totalSupply()).to.equal(1000);

    await expect(auraToken.burn(2000, [])).to.be.revertedWith(
      "ERC777: burn amount exceeds balance"
    );

    expect(await auraToken.totalSupply()).to.equal(1000);
  });
});
