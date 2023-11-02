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

describe("Mint in order", () => {
    let signer: SignerWithAddress;
    let signerAddress: string;
  
    let artist: SignerWithAddress;
    let artistAddress: string;    
  
    let user: SignerWithAddress;
    let userAddress: string; 
  
    let dynamicSketch: DropCreator;
    let minterContract: ExpandedNFT;
  
    const nullAddress = "0x0000000000000000000000000000000000000000";
  
    beforeEach(async () => {
      signer = (await ethers.getSigners())[0];
      signerAddress = await signer.getAddress();
  
      artist = (await ethers.getSigners())[1];
      artistAddress = await artist.getAddress();   
      
      user = (await ethers.getSigners())[2];
      userAddress = await user.getAddress();
  
      const { DropCreator } = await deployments.fixture([
        "DropCreator",
        "ExpandedNFT",
      ]);
  
      dynamicSketch = (await ethers.getContractAt(
        "DropCreator",
        DropCreator.address
      )) as DropCreator;
  
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
  
      const mintCost = ethers.utils.parseEther("0.1");
      await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 1);   
    });
  
    it("General user access control", async () => {
      await minterContract.setAllowedMinter(0);
  
      // Mint as a contract owner
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("NotAllowedToMint");      
  
      await minterContract.setAllowedMinter(1);
  
      // Mint as a member of the allow list
      await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("NotAllowedToMint");   
  
      await minterContract.setAllowedMinter(2);
  
      // Mint as the general public
      await expect(minterContract.connect(user).mintEdition(userAddress, {
        value: ethers.utils.parseEther("0.1")
      }))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          userAddress,
          1
        );
        
      expect(await minterContract.totalSupply()).to.be.equal(1);
    });
    
    it("Reserved IDs are minted first", async () => {
      const mintCost = ethers.utils.parseEther("0.1");
      await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 2);   
  
      await minterContract.setAllowedMinter(2);
      await minterContract.reserve([artistAddress], [10]);   
      
      expect(await minterContract.isReserved(10)).to.be.equal(true);
      expect(await minterContract.whoReserved(10)).to.be.equal(artistAddress);  
      expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(1); 
      expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([10].toString());     
  
      expect(await minterContract.connect(artist).mintMultipleEditions(artistAddress, 2, { value: ethers.utils.parseEther("0.2") })).to.emit(minterContract, "EditionSold");
   
      expect(await minterContract.totalSupply()).to.be.equal(2);
      expect(await minterContract.ownerOf(1)).to.be.equal(artistAddress);
      expect(await minterContract.ownerOf(10)).to.be.equal(artistAddress);          
      expect(await minterContract.getMintLimit(artistAddress)).to.be.equal(0);  
      expect(await minterContract.isReserved(10)).to.be.equal(false);
      expect(await minterContract.whoReserved(10)).to.be.equal(nullAddress);  
      expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(0); 
      expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([0].toString());       
    }); 

    it("Only the reserving wallet can mint a reserved edition", async () => {
      const mintCost = ethers.utils.parseEther("0.1");
      await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 3);   
  
      await minterContract.setAllowedMinter(2);
      await minterContract.reserve([artistAddress, artistAddress], [1, 2]);   
      
      expect(await minterContract.isReserved(1)).to.be.equal(true);
      expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress); 
      expect(await minterContract.isReserved(2)).to.be.equal(true);
      expect(await minterContract.whoReserved(2)).to.be.equal(artistAddress);  
      expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(2); 
      expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1, 2].toString());     
  
      expect(await minterContract.mintMultipleEditions(signerAddress, 2, { value: ethers.utils.parseEther("0.2") })).to.emit(minterContract, "EditionSold");
   
      expect(await minterContract.totalSupply()).to.be.equal(2);
      expect(await minterContract.ownerOf(3)).to.be.equal(signerAddress);
      expect(await minterContract.ownerOf(4)).to.be.equal(signerAddress);          
      expect(await minterContract.getMintLimit(artistAddress)).to.be.equal(3); 
      expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(8);     
      expect(await minterContract.isReserved(1)).to.be.equal(true);
      expect(await minterContract.whoReserved(1)).to.be.equal(artistAddress); 
      expect(await minterContract.isReserved(2)).to.be.equal(true);
      expect(await minterContract.whoReserved(2)).to.be.equal(artistAddress);   
      expect(await minterContract.getReservationsCount(artistAddress)).to.be.equal(2); 
      expect((await minterContract.getReservationsList(artistAddress)).toString()).to.be.equal([1, 2].toString());       
    });     
});
