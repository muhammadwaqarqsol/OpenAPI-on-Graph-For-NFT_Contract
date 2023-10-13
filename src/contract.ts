import {
  NFTBought as NFTBoughtEvent,
  NFTCreated as NFTCreatedEvent,
  NFTListed as NFTListedEvent,
  NFTTransferred as NFTTransferredEvent,
  NFTUnlisted as NFTUnlistedEvent,
} from "../generated/Contract/Contract";
import { Token, User, Transfer, Buy } from "../generated/schema";
import { BigInt, ipfs, json } from "@graphprotocol/graph-ts";

export function handleNFTCreated(event: NFTCreatedEvent): void {
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    token = new Token(event.params.tokenId.toString());
    token.tokenID = event.params.tokenId;
    token.contentURI = event.params.tokenUri;
    token.createdAtTimestamp = event.block.timestamp;
    token.price = BigInt.fromString("0");
    token.Listed = false;
    // Extracting the last part of the token URI
    let input: string = event.params.tokenUri;
    let delimiter: string = "/";
    let lastIndex: i32 = input.lastIndexOf(delimiter);
    let lastPart: string = lastIndex >= 0 ? input.slice(lastIndex + 1) : input;

    // Fetch metadata from IPFS using the last part
    let metadata = ipfs.cat(lastPart);
    if (metadata) {
      const value = json.fromBytes(metadata).toObject();
      if (value) {
        const name = value.get("name");
        const desc = value.get("description");
        const image = value.get("image");
        if (name) {
          token.Name = name.toString();
        }
        if (desc) {
          token.Description = desc.toString();
        }
        if (image) {
          token.ImageUrl = image.toString();
        }
      }
    }
  }
  token.creator = event.params.creator.toHexString();
  token.owner = event.params.creator.toHexString();
  token.save();
  let user = User.load(event.params.creator.toHexString());
  if (!user) {
    user = new User(event.params.creator.toHexString());
    user.save();
  }
}

export function handleNFTListed(event: NFTListedEvent): void {
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  token.Listed = true;
  token.price = BigInt.fromString(event.params.price.toString());
  token.save();
}

export function handleNFTBought(event: NFTBoughtEvent): void {
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  let Buyer = Buy.load(event.params.tokenId.toString());
  if (!Buyer) {
    Buyer = new Buy(event.params.tokenId.toString());
    Buyer.from = event.params.seller;
    Buyer.to = event.params.buyer;
    Buyer.tokenId = event.params.tokenId;
    Buyer.blockNumber = event.block.number;
    Buyer.blockTimestamp = event.block.timestamp;
    Buyer.transactionHash = event.transaction.hash;
    Buyer.price = event.params.price.toString();
    let input: string = event.params.tokenUri;
    let delimiter: string = "/";
    let lastIndex: i32 = input.lastIndexOf(delimiter);
    let lastPart: string = lastIndex >= 0 ? input.slice(lastIndex + 1) : input;

    // Fetch metadata from IPFS using the last part
    let metadata = ipfs.cat(lastPart);
    if (metadata) {
      const value = json.fromBytes(metadata).toObject();
      if (value) {
        const name = value.get("name");
        const desc = value.get("description");
        const image = value.get("image");
        if (name) {
          Buyer.Name = name.toString();
        }
        if (desc) {
          Buyer.Description = desc.toString();
        }
        if (image) {
          Buyer.ImageUrl = image.toString();
        }
      }
    }
    Buyer.save();
  }
  token.owner = event.params.buyer.toHexString();
  token.price = BigInt.fromString(event.params.price.toString());
  token.Listed = false;
  token.save();
  let user = User.load(event.params.buyer.toHexString());
  if (!user) {
    user = new User(event.params.buyer.toHexString());
    user.save();
  }
}

export function handleNFTUnlisted(event: NFTUnlistedEvent): void {
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  token.price = BigInt.fromString("0");
  token.Listed = false;
  token.save();
}

export function handleNFTTransferred(event: NFTTransferredEvent): void {
  let token = Token.load(event.params.tokenId.toString());
  if (!token) {
    return;
  }
  token.owner = event.params.receiver.toHexString();
  token.price = null;
  token.Listed = false;
  token.save();
  let user = User.load(event.params.receiver.toHexString());
  if (!user) {
    user = new User(event.params.receiver.toHexString());
    user.save();
  }
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );
  entity.from = event.params.creator;
  entity.to = event.params.receiver;
  entity.tokenId = event.params.tokenId;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  let input: string = event.params.tokenUri;
  let delimiter: string = "/";
  let lastIndex: i32 = input.lastIndexOf(delimiter);
  let lastPart: string = lastIndex >= 0 ? input.slice(lastIndex + 1) : input;

  // Fetch metadata from IPFS using the last part
  let metadata = ipfs.cat(lastPart);
  if (metadata) {
    const value = json.fromBytes(metadata).toObject();
    if (value) {
      const name = value.get("name");
      const desc = value.get("description");
      const image = value.get("image");
      if (name) {
        entity.Name = name.toString();
      }
      if (desc) {
        entity.Description = desc.toString();
      }
      if (image) {
        entity.ImageUrl = image.toString();
      }
    }
  }
  entity.save();
}
