// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
  TestPassOne,
  TestPassTwo,
} from "../typechain";

describe("Discounts", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;    

  let user: SignerWithAddress;
  let userAddress: string; 

  let dynamicSketch: DropCreator;
  let minterContract: ExpandedNFT;
  let annualPassContract: TestPassOne;
  let lifetimePassContract: TestPassTwo;

  const mintCostAllowlist = ethers.utils.parseEther("0.4");
  const mintCostGeneral = ethers.utils.parseEther("0.8");

  const mintCostAllowlistLifetimePass = ethers.utils.parseEther("0.2");
  const mintCostGeneralLifetimePass = ethers.utils.parseEther("0.4");

  const mintCostAllowlistAnnualPass = ethers.utils.parseEther("0.3");
  const mintCostGeneralAnnualPass = ethers.utils.parseEther("0.6");

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
      10, true);

    const dropResult = await dynamicSketch.getDropAtId(0);   
    minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    const { TestPassOne } = await deployments.fixture(["TestPassOne"]);
    annualPassContract = (await ethers.getContractAt(
      "TestPassOne",
      TestPassOne.address
    )) as TestPassOne;    
    annualPassContract.initialize();

    const { TestPassTwo } = await deployments.fixture(["TestPassTwo"]);
    lifetimePassContract = (await ethers.getContractAt(
      "TestPassTwo",
      TestPassTwo.address
    )) as TestPassTwo;
    lifetimePassContract.initialize();

    await minterContract.setPricing(10, 500, mintCostAllowlist, mintCostGeneral, 2, 1);  
    const mintCostAllowlistLifetimePass = ethers.utils.parseEther("0.2");
    const mintCostGeneralLifetimePass = ethers.utils.parseEther("0.4");
  
    const mintCostAllowlistAnnualPass = ethers.utils.parseEther("0.3");
    const mintCostGeneralAnnualPass = ethers.utils.parseEther("0.6");


    await minterContract.updateDiscounts(annualPassContract.address, lifetimePassContract.address, 
      mintCostAllowlistAnnualPass,  mintCostGeneralAnnualPass, 
      mintCostAllowlistLifetimePass, mintCostGeneralLifetimePass); 
  });
  
  it("A non pass holder can not mint while the drop is not for sale", async () => {
    await minterContract.setAllowedMinter(0);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.be.revertedWith("Needs to be an allowed minter");     
  });  

  it("A non pass holder can not mint while the drop is only for sale to allow listed wallets", async () => {
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.be.revertedWith("Needs to be an allowed minter");
  });  
  
  it("A non pass holder can not mint while the drop is only for sale to all wallets", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.8") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  }); 
  
  it("A lifetime pass holder can not mint while the drop is not for sale", async () => {
    await lifetimePassContract.connect(user).mint(userAddress);
    expect(await lifetimePassContract.balanceOf(userAddress)).to.be.equal(1);

    await minterContract.setAllowedMinter(0);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.be.revertedWith("Needs to be an allowed minter");
  });  

  it("A lifetime pass holder can mint while the drop is only for sale to allow listed wallets", async () => {
    await lifetimePassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.2") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);   
  });  
  
  it("A multiple  lifetime pass holder can mint while the drop is only for sale to allow listed wallets", async () => {
    await lifetimePassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.2") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);   
  });  

  it("A lifetime pass holder can not mint sending the wrong price on the allow list", async () => {
    await lifetimePassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.9") })).to.be.revertedWith("Wrong price");
  });  

  it("A lifetime pass holder can not mint while the drop is only for sale to all wallets", async () => {
    await lifetimePassContract.connect(user).mint(userAddress);    
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  });  
  
  it("A multiple lifetime pass holder can not mint while the drop is only for sale to all wallets", async () => {
    await lifetimePassContract.connect(user).mint(userAddress);    
    await lifetimePassContract.connect(user).mint(userAddress);        
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  });  

  it("A lifetime pass holder can not mint sending the wrong price", async () => {
    await lifetimePassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.9") })).to.be.revertedWith("Wrong price");
  });   

  it("A annual pass holder can not mint while the drop is not for sale", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(0);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.be.revertedWith("Needs to be an allowed minter");
  });  

  it("A annual pass holder can mint while the drop is only for sale to allow listed wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.3") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);   
  });  

  it("A multiple annual pass holder can mint while the drop is only for sale to allow listed wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await annualPassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.3") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);   
  });  

  it("A annual pass holder can not mint sending the wrong price", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.9") })).to.be.revertedWith("Wrong price");
  });   
  
  it("A annual pass holder can not mint while the drop is only for sale to all wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);    
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.6") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  });  

  it("A multiple annual pass holder can not mint while the drop is only for sale to all wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);  
    await annualPassContract.connect(user).mint(userAddress);    
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.6") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  });  

  it("A annual pass holder can not mint sending the wrong price", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.9") })).to.be.revertedWith("Wrong price");
  });    

  it("A annual and lifetime pass holder can not mint while the drop is not for sale", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);  
    await minterContract.setAllowedMinter(0);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.be.revertedWith("Needs to be an allowed minter");
  });  

  it("A annual and lifetime pass holder can mint while the drop is only for sale to allow listed wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);  
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.2") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);   
  }); 
  
  it("A multiple annual and lifetime pass holder can mint while the drop is only for sale to allow listed wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await annualPassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);      
    await lifetimePassContract.connect(user).mint(userAddress);  
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.2") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);   
  }); 

  it("A annual and lifetime pass holder can not mint while the drop is not for sale", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);  
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.be.revertedWith("Wrong price");
  }); 
  
  it("A annual and lifetime pass holder can not mint while the drop is only for sale to all wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);      
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  });  

  it("A multiple annual and lifetime pass holder can not mint while the drop is only for sale to all wallets", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await annualPassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);     
    await lifetimePassContract.connect(user).mint(userAddress);      
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.4") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  }); 

  it("A annual and lifetime pass holder can not mint while the drop is not for sale", async () => {
    await annualPassContract.connect(user).mint(userAddress);
    await lifetimePassContract.connect(user).mint(userAddress);  
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.9") })).to.be.revertedWith("Wrong price");
  }); 

  it("A pass holder can mint for free with 100% discount", async () => {
    await minterContract.updateDiscounts(annualPassContract.address, lifetimePassContract.address, 0, 0, 0, 0); 

    await annualPassContract.connect(user).mint(userAddress);    
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  });  

  it("A pass holder can mint for the standard cost with 0% discount", async () => {
    const mintCostAllowlistLifetimePass = ethers.utils.parseEther("0.4");
    const mintCostGeneralLifetimePass = ethers.utils.parseEther("0.8");
  
    const mintCostAllowlistAnnualPass = ethers.utils.parseEther("0.4");
    const mintCostGeneralAnnualPass = ethers.utils.parseEther("0.8");

    await minterContract.updateDiscounts(annualPassContract.address, lifetimePassContract.address,  mintCostAllowlistAnnualPass, mintCostGeneralAnnualPass,
      mintCostAllowlistLifetimePass, mintCostGeneralLifetimePass); 
    
    await annualPassContract.connect(user).mint(userAddress);    
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.8") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(9);     

  });  

});
