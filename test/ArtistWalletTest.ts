import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";
import parseDataURI from "data-urls";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  ExpandedNFT,
} from "../typechain";

describe("ArtistWallet", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;
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
  });

  it("makes a new drop", async () => {
    const artist = (await ethers.getSigners())[1];
    const artistAddress = await artist.getAddress();

    const newArtist = (await ethers.getSigners())[2];
    const newArtistAddress = await newArtist.getAddress();

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      10)

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "ExpandedNFT",
      dropResult
    )) as ExpandedNFT;

    await minterContract.loadMetadataChunk(  
      ["This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all",
      "This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all","This is a testing token for all"],
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

    minterContract.setPricing(10, 500, 10, 10, 10, 1, 1, 1);

    expect(await minterContract.getArtistWallet()).to.be.equal(artistAddress);

    minterContract.setArtistWallet(newArtistAddress);
    
    expect(await minterContract.getArtistWallet()).to.be.equal(newArtistAddress);

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
    expect(await minterContract.totalSupply()).to.be.equal(0); 
    expect(await minterContract.owner()).to.be.equal(signerAddress);
  });
});
