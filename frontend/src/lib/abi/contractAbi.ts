import { parseAbi } from "viem";

export const payAbi = parseAbi([
  "function register(string username, string displayName, string bio)",
  "function tip(address to, string message) payable",
  "function getCreator(address creator) view returns ((address creator, string username, string displayName, string bio, uint256 createdAt, bool exists))",
  "function getAddressByUsername(string username) view returns (address)",
  "event CreatorRegistered(address indexed creator, string username, string displayName, string bio)",
  "event Tipped(address indexed to, address indexed from, uint256 amount, string message, uint256 timestamp)",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);
