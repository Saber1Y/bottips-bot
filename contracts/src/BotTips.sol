// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BotTips
/// @notice Creator tipping on BOT Chain - tips go through contract to be trackable on-chain.
contract BotTips {
    struct Creator {
        address creator;
        string username;
        string displayName;
        string bio;
        uint256 createdAt;
        bool exists;
    }

    mapping(address => Creator) public creators;
    mapping(string => address) public usernameToAddress;

    event CreatorRegistered(
        address indexed creator,
        string username,
        string displayName,
        string bio
    );

    event Tipped(
        address indexed to,
        address indexed from,
        uint256 amount,
        string message,
        uint256 timestamp
    );

    error UsernameTaken();
    error AlreadyRegistered();
    error InvalidUsername();
    error CreatorNotFound();
    error ZeroAmount();

    function register(
        string calldata username,
        string calldata displayName,
        string calldata bio
    ) external {
        if (bytes(username).length == 0) revert InvalidUsername();
        if (creators[msg.sender].exists) revert AlreadyRegistered();
        address existing = usernameToAddress[username];
        if (existing != address(0)) revert UsernameTaken();

        creators[msg.sender] = Creator({
            creator: msg.sender,
            username: username,
            displayName: displayName,
            bio: bio,
            createdAt: block.timestamp,
            exists: true
        });
        usernameToAddress[username] = msg.sender;

        emit CreatorRegistered(msg.sender, username, displayName, bio);
    }

    function tip(address to, string calldata message) external payable {
        if (to == address(0)) revert CreatorNotFound();
        if (msg.value == 0) revert ZeroAmount();

        (bool ok, ) = to.call{value: msg.value}("");
        require(ok, "Transfer failed");

        emit Tipped(to, msg.sender, msg.value, message, block.timestamp);
    }

    function getCreator(address creator) external view returns (Creator memory) {
        return creators[creator];
    }

    function getAddressByUsername(string calldata username) external view returns (address) {
        return usernameToAddress[username];
    }
}
