import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("Token Mint", function () {
  let auraToken: any;
  let ownerAddress: any;
  let notTheOwner: Signer;

  beforeEach(async () => {
    let owner: Signer;
    [owner, notTheOwner] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();

    const AuraToken = await ethers.getContractFactory("AuraToken");
    auraToken = await AuraToken.deploy();
    await auraToken.deployed();
  });

  it("The owner should be able to mint new tokens", async function () {
    expect(await auraToken.totalSupply()).to.equal(0);

    await auraToken.mint(ownerAddress, 1000);

    expect(await auraToken.totalSupply()).to.equal(1000);
  });

  it("The only owner should be able to mint new tokens", async function () {
    expect(await auraToken.totalSupply()).to.equal(0);

    const auraTokenNotTheOwner = auraToken.connect(notTheOwner);
    await expect(
      auraTokenNotTheOwner.mint(ownerAddress, 1000)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    expect(await auraToken.totalSupply()).to.equal(0);
  });
});
