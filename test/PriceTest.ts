// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
} from "../typechain";

describe("Pricing", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;
  let dynamicSketch: DropCreator;
  let artist: SignerWithAddress;
  let artistAddress: string;
  let minterContract: ExpandedNFT;

  const nullAddress = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "ExpandedNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();

    await dynamicSketch.createDrop(
      artistAddress, "Testing Token",
      "TEST", "http://example.com/token/", 10, true);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

  });

  it("Allow list price", async () => {
    expect(await minterContract.getAllowListPrice()).to.be.equal(10);
  });

  it("Can change allow list price", async () => {
    expect(await minterContract.getAllowListPrice()).to.be.equal(10);

    await minterContract.setAllowListSalePrice(20);

    expect(await minterContract.getAllowListPrice()).to.be.equal(20);
  });

  it("Try to change allow list price not as the owner", async () => {
    await expect(minterContract.connect(artist).setAllowListSalePrice(20)).to.be.revertedWith("Ownable: caller is not the owner"); 
  });

  it("Can change all the prices", async () => {
    expect(await minterContract.getAllowListPrice()).to.be.equal(10);
    expect(await minterContract.salePrice()).to.be.equal(10);

    await minterContract.setSalePrices(20, 15);

    expect(await minterContract.getAllowListPrice()).to.be.equal(20);
    expect(await minterContract.salePrice()).to.be.equal(15);    
  });

  it("Try to change all prices not as the owner", async () => {
    await expect(minterContract.connect(artist).setSalePrices(20, 15)).to.be.revertedWith("Ownable: caller is not the owner");  
  });  

  it("Try to change pricing not as the owner", async () => {
    await expect(minterContract.connect(artist).setPricing(10, 500, 10, 10, 1, 1)).to.be.revertedWith("Ownable: caller is not the owner");  
  });  

  it("Try to change sale price not as the owner", async () => {
    await expect(minterContract.connect(artist).setSalePrice(10)).to.be.revertedWith("Ownable: caller is not the owner");  
  });  

  it("Not for sale price", async () => {
    await minterContract.setAllowedMinter(0);

    expect(await minterContract.price()).to.be.equal(0);
  });

  it("Set the discount not as the owner", async () => {
    await expect(minterContract.connect(artist).updateDiscounts(nullAddress, nullAddress, 10, 10, 10, 10)).to.be.revertedWith("Ownable: caller is not the owner"); 
  });

  it("Set the discount as the owner", async () => {
    const testAddress1 = "0x0123456789012345678901234567890123456789";
    const testAddress2 = "0x9876543210987654321098765432109876543210";

    expect(await minterContract.getAnnualPassAddress()).to.be.equal(nullAddress);
    expect(await minterContract.getLifetimePassAddress()).to.be.equal(nullAddress);
    expect(await minterContract.getAnnualPassAllowListPrice()).to.be.equal(0);
    expect(await minterContract.getAnnualPassGeneralPrice()).to.be.equal(0);
    expect(await minterContract.getLifetimeAllowListPassPrice()).to.be.equal(0);    
    expect(await minterContract.getLifetimePassGeneralPrice()).to.be.equal(0);

    await minterContract.updateDiscounts(testAddress1, testAddress2, 10, 20, 30, 40);
    
    expect(await minterContract.getAnnualPassAddress()).to.be.equal(testAddress1);
    expect(await minterContract.getLifetimePassAddress()).to.be.equal(testAddress2);
    expect(await minterContract.getAnnualPassAllowListPrice()).to.be.equal(10);
    expect(await minterContract.getAnnualPassGeneralPrice()).to.be.equal(20);
    expect(await minterContract.getLifetimeAllowListPassPrice()).to.be.equal(30);    
    expect(await minterContract.getLifetimePassGeneralPrice()).to.be.equal(40);  
  });
});