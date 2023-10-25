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

describe("Allow List", () => {
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

  it("Only the owner can update the allow list", async () => {
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Try to add a wallet to the allow list
    await expect(minterContract.connect(artist).setAllowListMinters(1, [artistAddress], [true])).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Add a wallet to the allow list", async () => {
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress].toString());
  });

  it("Add a wallet twice to the allow list", async () => {
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress].toString());

    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress].toString());
  });  

  it("Remove a wallet to the allow list", async () => {
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);    
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress].toString());

    // Remove a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [false])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);
    expect(await minterContract.getAllowListCount()).to.be.equal(0);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([nullAddress].toString());
  });

  it("Remove a wallet more than once", async () => {
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);    
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress].toString());

    // Remove a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [false])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);
    expect(await minterContract.getAllowListCount()).to.be.equal(0);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([nullAddress].toString());

    // Remove a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [false])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);
    expect(await minterContract.getAllowListCount()).to.be.equal(0);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([nullAddress].toString());   
  });  

  it("Add a multiple wallets and remvoe the first to the allow list", async () => {
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress].toString());

    await minterContract.setAllowListMinters(1, [signerAddress], [true])
    expect(await minterContract.allowListed(signerAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(2);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress, signerAddress].toString());

    // Remove a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [false])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([nullAddress, signerAddress].toString());       
  });  

  it("Add a multiple wallets and remvoe the second to the allow list", async () => {
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(false);

    // Add a wallet to the allow list
    await minterContract.setAllowListMinters(1, [artistAddress], [true])
    expect(await minterContract.allowListed(artistAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress].toString());

    await minterContract.setAllowListMinters(1, [signerAddress], [true])
    expect(await minterContract.allowListed(signerAddress)).to.be.equal(true);
    expect(await minterContract.getAllowListCount()).to.be.equal(2);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress, signerAddress].toString());

    // Remove a wallet to the allow list
    await minterContract.setAllowListMinters(1, [signerAddress], [false])
    expect(await minterContract.allowListed(signerAddress)).to.be.equal(false);
    expect(await minterContract.getAllowListCount()).to.be.equal(1);
    expect((await minterContract.getAllowList()).toString()).to.be.equal([artistAddress, nullAddress].toString());       
  });  

});
