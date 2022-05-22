import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";
import parseDataURI from "data-urls";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  SingleEditionMintableCreator,
  SingleEditionMintable,
} from "../typechain";

describe("Membership", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;
  let dynamicSketch: SingleEditionMintableCreator;

  beforeEach(async () => {
    const { SingleEditionMintableCreator } = await deployments.fixture([
      "SingleEditionMintableCreator",
      "SingleEditionMintable",
    ]);
    const dynamicMintableAddress = (
      await deployments.get("SingleEditionMintable")
    ).address;
    dynamicSketch = (await ethers.getContractAt(
      "SingleEditionMintableCreator",
      SingleEditionMintableCreator.address
    )) as SingleEditionMintableCreator;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();
  });

  it("makes a new edition", async () => {
    await dynamicSketch.createEdition(
      "Testing Token",
      "TEST",
      "This is a testing token for all",
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      // 1% royalty since BPS
      10,
      10
    );

    const editionResult = await dynamicSketch.getEditionAtId(0);
    const minterContract = (await ethers.getContractAt(
      "SingleEditionMintable",
      editionResult
    )) as SingleEditionMintable;
    expect(await minterContract.name()).to.be.equal("Testing Token");
    expect(await minterContract.symbol()).to.be.equal("TEST");
    const editionUris = await minterContract.getURIs();
    expect(editionUris[0]).to.be.equal("");
    expect(editionUris[1]).to.be.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(editionUris[2]).to.be.equal(
      "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy"
    );
    expect(editionUris[3]).to.be.equal(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
    expect(await minterContract.editionSize()).to.be.equal(10);
    // TODO(iain): check bps
    expect(await minterContract.owner()).to.be.equal(signerAddress);
  });
  describe("with a edition", () => {
    let signer1: SignerWithAddress;
    let minterContract: SingleEditionMintable;
    beforeEach(async () => {
      signer1 = (await ethers.getSigners())[1];
      await dynamicSketch.createEdition(
        "Testing Token",
        "TEST",
        "This is a testing token for all",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        10,
        10
      );

      const editionResult = await dynamicSketch.getEditionAtId(0);
      minterContract = (await ethers.getContractAt(
        "SingleEditionMintable",
        editionResult
      )) as SingleEditionMintable;
    });
    it("creates a new edition", async () => {
      expect(await signer1.getBalance()).to.eq(
        ethers.utils.parseEther("10000")
      );

      // Mint first edition
      await expect(minterContract.mintEdition(signerAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          signerAddress,
          1
        );

      const tokenURI = await minterContract.tokenURI(1);
      console.log(tokenURI);
      const parsedTokenURI = parseDataURI(tokenURI);
      if (!parsedTokenURI) {
        throw "No parsed token uri";
      }

      // Check metadata from edition
      const uriData = Buffer.from(parsedTokenURI.body).toString("utf-8");
      const metadata = JSON.parse(uriData);

      expect(parsedTokenURI.mimeType.type).to.equal("application");
      expect(parsedTokenURI.mimeType.subtype).to.equal("json");
      // expect(parsedTokenURI.mimeType.parameters.get("charset")).to.equal(
      //   "utf-8"
      // );
      expect(JSON.stringify(metadata)).to.equal(
        JSON.stringify({
          name: "Testing Token 1/10",
          description: "This is a testing token for all",
          animation_url:
            "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy?id=1",
          properties: { number: 1, name: "Testing Token" },
        })
      );
    });
    it("creates an unbounded edition", async () => {
      // no limit for edition size
      await dynamicSketch.createEdition(
        "Testing Token",
        "TEST",
        "This is a testing token for all",
        "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        0,
        0
      );

      const editionResult = await dynamicSketch.getEditionAtId(1);
      minterContract = (await ethers.getContractAt(
        "SingleEditionMintable",
        editionResult
      )) as SingleEditionMintable;

      expect(await minterContract.totalSupply()).to.be.equal(0);

      // Mint first edition
      await expect(minterContract.mintEdition(signerAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          signerAddress,
          1
        );

      expect(await minterContract.totalSupply()).to.be.equal(1);

      // Mint second edition
      await expect(minterContract.mintEdition(signerAddress))
        .to.emit(minterContract, "Transfer")
        .withArgs(
          "0x0000000000000000000000000000000000000000",
          signerAddress,
          2
        );

      expect(await minterContract.totalSupply()).to.be.equal(2);

      const tokenURI = await minterContract.tokenURI(1);
      const parsedTokenURI = parseDataURI(tokenURI);
      if (!parsedTokenURI) {
        throw "No parsed token uri";
      }

      const tokenURI2 = await minterContract.tokenURI(2);
      const parsedTokenURI2 = parseDataURI(tokenURI2);

      // Check metadata from edition
      const uriData = Buffer.from(parsedTokenURI.body).toString("utf-8");
      const metadata = JSON.parse(uriData);

      const uriData2 = Buffer.from(parsedTokenURI2?.body || "").toString(
        "utf-8"
      );
      const metadata2 = JSON.parse(uriData2);
      expect(metadata2.name).to.be.equal("Testing Token 2");

      expect(parsedTokenURI.mimeType.type).to.equal("application");
      expect(parsedTokenURI.mimeType.subtype).to.equal("json");
      expect(JSON.stringify(metadata)).to.equal(
        JSON.stringify({
          name: "Testing Token 1",
          description: "This is a testing token for all",
          animation_url:
            "https://ipfs.io/ipfsbafybeify52a63pgcshhbtkff4nxxxp2zp5yjn2xw43jcy4knwful7ymmgy?id=1",
          properties: { number: 1, name: "Testing Token" },
        })
      );
    });
    it("creates an authenticated edition", async () => {
      await minterContract.mintEdition(await signer1.getAddress());
      expect(await minterContract.ownerOf(1)).to.equal(
        await signer1.getAddress()
      );
    });
    it("creates a set of editions", async () => {
      const [s1, s2, s3] = await ethers.getSigners();
      await minterContract.mintEditions([
        await s1.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
      ]);
      expect(await minterContract.ownerOf(1)).to.equal(await s1.getAddress());
      expect(await minterContract.ownerOf(2)).to.equal(await s2.getAddress());
      expect(await minterContract.ownerOf(3)).to.equal(await s3.getAddress());
      await minterContract.mintEditions([
        await s1.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
      ]);
      await expect(minterContract.mintEditions([signerAddress])).to.be.reverted;
      await expect(minterContract.mintEdition(signerAddress)).to.be.reverted;
    });
  });
});
