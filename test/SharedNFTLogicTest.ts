// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";
import parseDataURI from "data-urls";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
} from "../typechain";

describe("SharedNFTLogicTest", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let dynamicSketch: DropCreator;

  beforeEach(async () => {
    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "ExpandedNFT",
    ]);
    const dynamicMintableAddress = (
      await deployments.get("ExpandedNFT")
    ).address;
    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await signer.getAddress();

  });

  it("makes a new drop with an animation", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      10, // 1% royalty since BPS  
    );

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    await minterContract.loadMetadataChunk(
      1, 10,      
        ["This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all",
        "This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all", "This is a testing token for all"],
      ["https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy", "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"],
      ["0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000"],
      ["", "", "", "", "", "", "", "", "", ""],
      ["0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000"]
    );

    await minterContract.setPricing(10, 500, 0.1, 0.1, 0.1, 10, 10, 10);

    expect(await minterContract.name()).to.be.equal("Testing Token");
    expect(await minterContract.symbol()).to.be.equal("TEST");
    const dropUris = await minterContract.getURIs(1);
    expect(dropUris[0]).to.be.equal("");
    expect(dropUris[1]).to.be.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(dropUris[2]).to.be.equal(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
    expect(dropUris[3]).to.be.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(await minterContract.dropSize()).to.be.equal(10);
    expect(await minterContract.owner()).to.be.equal(signerAddress);

    await minterContract.setAllowedMinter(3);

    // Mint first edition
    await expect(minterContract.mintEdition(signerAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        signerAddress,
        1
      );

    const tokenURI = await minterContract.tokenURI(1);

    const parsedTokenURI = parseDataURI(tokenURI);
    if (!parsedTokenURI) {
      throw "No parsed token uri";
    }


  });
});
