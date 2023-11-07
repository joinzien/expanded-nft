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

describe("Reservations", () => {
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

  it("Only the owner can make reservations", async () => {
    await expect(minterContract.connect(artist).reserve([artistAddress], [1])).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Number of wallet and tokenID must match", async () => {
    await expect(minterContract.reserve([artistAddress], [1, 2])).to.be.revertedWith("LengthMismatch");
  });

  it("Make a reservation", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0);  

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString());    
    
  });

  it("Try to make a reservation of an already reserved ID", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0); 

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1);     
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString()); 

    await expect(minterContract.reserve([artistAddress], [1])).to.be.revertedWith("MustBeUnminted");

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1);      
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString()); 
  });

  it("Make multiple reservations", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0);  

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString());    

 
    await minterContract.reserve([signerAddress], [3]);

    expect(await minterContract.isReserved(3)).to.be.equal(true);
    expect(await minterContract.whoReserved(3)).to.be.equal(signerAddress);  
    expect(await minterContract.getReservationsCount(signerAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(signerAddress)).toString()).to.be.equal([3].toString());       
    
  });

  it("Make multiple reservations for the same user", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0);  

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString());    
 
    await minterContract.reserve([artistAddress], [3]);

    expect(await minterContract.isReserved(3)).to.be.equal(true);
    expect(await minterContract.whoReserved(3)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(2); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1,3].toString()); 
  });

  it("Only the owner can unreservations", async () => {
    await expect(minterContract.connect(artist).unreserve([1])).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Unreservation an edition", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0); 

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString()); 

    await minterContract.unreserve([1]);

    expect(await minterContract.isReserved(1)).to.be.equal(false);
    expect(await minterContract.whoReserved(1)).to.be.equal(nullAddress);
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0);
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([0].toString());          
  });

  it("Make multiple reservations and then unreserve first one", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0);  

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString());    
 
    await minterContract.reserve([artistAddress], [3]);

    expect(await minterContract.isReserved(3)).to.be.equal(true);
    expect(await minterContract.whoReserved(3)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(2); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1,3].toString()); 
    
    await minterContract.unreserve([1]);

    expect(await minterContract.isReserved(1)).to.be.equal(false);
    expect(await minterContract.whoReserved(1)).to.be.equal(nullAddress);
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1);
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([0,3].toString());    
  });

  it("Make multiple reservations and then unreserve the second one", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0);  

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString());    
 
    await minterContract.reserve([artistAddress], [3]);

    expect(await minterContract.isReserved(3)).to.be.equal(true);
    expect(await minterContract.whoReserved(3)).to.be.equal(artistAddress);  
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(2); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1,3].toString()); 
    
    await minterContract.unreserve([3]);

    expect(await minterContract.isReserved(3)).to.be.equal(false);
    expect(await minterContract.whoReserved(3)).to.be.equal(nullAddress);
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1);
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1,0].toString());    
  });

  it("Only the owner can unreservations", async () => {
    await expect(minterContract.connect(artist).unreserve([1])).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Unreservation an edition that isn't reserved", async () => {
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0); 

    await minterContract.reserve([artistAddress], [1]);

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress);  
    expect(await minterContract.isReserved(2)).to.be.equal(false);
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString()); 

    await expect(minterContract.unreserve([2])).to.be.revertedWith("NotReserved");

    expect(await minterContract.isReserved(1)).to.be.equal(true);
    expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress); 
    expect(await minterContract.isReserved(2)).to.be.equal(false);    
    expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1);
    expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1].toString());      
  });
});
