import { expect } from "chai";
import { ethers } from "hardhat";

describe("Token Transfer", function () {
  let auraToken: any;

  let ownerAddress: any;
  let otherAddress: any;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    const owner = signers[0];
    ownerAddress = await owner.getAddress();

    const other = signers[1];
    otherAddress = await other.getAddress();

    const AuraToken = await ethers.getContractFactory("AuraToken");
    auraToken = await AuraToken.deploy();
    await auraToken.deployed();
  });

  it("The token owner can transfer tokens to another account", async function () {
    expect(await auraToken.totalSupply()).to.equal(0);
    expect(await auraToken.balanceOf(ownerAddress)).to.equal(0);
    expect(await auraToken.balanceOf(otherAddress)).to.equal(0);

    await auraToken.mint(ownerAddress, 1000);

    expect(await auraToken.totalSupply()).to.equal(1000);
    expect(await auraToken.balanceOf(ownerAddress)).to.equal(1000);
    expect(await auraToken.balanceOf(otherAddress)).to.equal(0);

    await auraToken.transfer(otherAddress, 1000);

    expect(await auraToken.totalSupply()).to.equal(1000);
    expect(await auraToken.balanceOf(ownerAddress)).to.equal(0);
    expect(await auraToken.balanceOf(otherAddress)).to.equal(1000);
  });
});
