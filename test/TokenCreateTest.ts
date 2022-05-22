import { expect } from "chai";
import { ethers } from "hardhat";

describe("Token Create", function () {
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

  it("Should return the name of the Token", async function () {
    expect(await auraToken.name()).to.equal("New Aura Token");
  });

  it("Should return the symbol of the Token", async function () {
    expect(await auraToken.symbol()).to.equal("AURA");
  });

  it("Should return the decimals of the Token", async function () {
    expect(await auraToken.decimals()).to.equal(18);
  });

  it("Should return the total supply of the Token", async function () {
    expect(await auraToken.totalSupply()).to.equal(0);
  });

  it("Should return the owner of the Token", async function () {
    expect(await auraToken.owner()).to.equal(ownerAddress);
  });
});
