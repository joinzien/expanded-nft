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

enum ExpandedNFTState {
  UNMINTED, 
  RESERVED, 
  MINTED, 
  REDEEM_STARTED, 
  REDEEMED
}

describe("Redeem", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let user: SignerWithAddress;
  let userAddress: string;

  let dynamicSketch: DropCreator;

  let minterContract: ExpandedNFT;

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

    user = (await ethers.getSigners())[2];
    userAddress = await user.getAddress();

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

    expect(
      await minterContract.setSalePrice(ethers.utils.parseEther("0.2"))
    ).to.emit(minterContract, "PriceChanged");

    expect(
      await minterContract
        .connect(user)
        .purchase({ value: ethers.utils.parseEther("0.2") })
    ).to.emit(minterContract, "EditionSold");

    expect(await minterContract.totalSupply()).to.be.equal(1);
  });

  it("Redeem an edition", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED);  

    await minterContract.productionStart(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    const redeemedUrl = "http://example.com/redempted/token04/";
    await minterContract.productionComplete(1, redeemedUrl);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEMED); 
  });

  it("Redeem an invalid edition, < 1", async () => {
    await expect(minterContract.productionStart(0)).to.be.revertedWith("InvalidTokenId"); 
  });

  it("Redeem an invalid edition, > drop size", async () => {
    await expect(minterContract.productionStart(11)).to.be.revertedWith("InvalidTokenId"); 
  });  

  it("Redeem  with an invalid ID", async () => {
    await expect(minterContract.productionStart(2)).to.be.revertedWith("InvalidTokenId"); 
  });

  it("Check the redeemed state an invalid edition. < 1", async () => {
    await expect(minterContract.connect(user).redeemedState(0)).to.be.revertedWith("InvalidTokenId"); 
  });

  it("Check the redeemed state an invalid edition. > drop size", async () => {
    await expect(minterContract.connect(user).redeemedState(11)).to.be.revertedWith("InvalidTokenId"); 
  });  

  it("Redeem  not as the owner", async () => {
    await expect(minterContract.connect(user).productionStart(1)).to.be.revertedWith("Ownable: caller is not the owner");
  });  

  it("Production complete not as the owner", async () => {
    await expect(minterContract.connect(user).productionComplete(1, "")).to.be.revertedWith("Ownable: caller is not the owner"); 
  });    

  it("Production complete with an invalid ID", async () => {
    await expect(minterContract.productionComplete(2, "")).to.be.revertedWith("InvalidTokenId"); 
  });

  it("Production complete in the wrong state", async () => {
    await expect(minterContract.productionComplete(1, "")).to.be.revertedWith("You currently can not redeem"); 
  });

  it("Redeem an edition more than once", async () => {
    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED);  

    await minterContract.productionStart(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    const redeemedUrl = "http://example.com/redempted/token04/";
    await minterContract.productionComplete(1, redeemedUrl);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEMED); 

    await expect(minterContract.productionStart(1)).to.be.revertedWith("Wrong state");
  });  

  it("URLs and meta data should change when redeemed", async () => {
    const startTokenURI = await minterContract.connect(user).tokenURI(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.MINTED);  

    await minterContract.productionStart(1);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEM_STARTED); 

    const redeemedUrl = "http://example.com/redempted/token04/";
    await minterContract.productionComplete(1, redeemedUrl);

    expect(await minterContract.connect(user).redeemedState(1)).to.equal(ExpandedNFTState.REDEEMED); 

    const endTokenURI = await minterContract.connect(user).tokenURI(1);
    
    expect(startTokenURI).to.not.equal(endTokenURI);    
  });  
});
