// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SecretManager {
    struct SecretData {
        address creator;
        address user;
        string postId;
        string title;
        string description;
        uint256 duration;
        bool isComplete;
    }

    mapping(bytes32 => SecretData) private secrets;
    string private constant SALT = "SOMERANDOMSECRET";

    function createPreSecret(address user) external returns (bytes32 secretHash) {
        secretHash = keccak256(abi.encodePacked(msg.sender, user, SALT));

        secrets[secretHash] = SecretData({
            creator: msg.sender,
            user: user,
            postId: "",
            title: "",
            description: "",
            duration: 0,
            isComplete: false
        });

        return secretHash;
    }

    function associatePostDetails(
        bytes32 secretHash,
        string memory postId,
        string memory title,
        string memory description,
        uint256 duration
    ) external {
        SecretData storage data = secrets[secretHash];

        require(data.creator == msg.sender, "Not creator of secret");
        require(!data.isComplete, "Details already associated");

        data.postId = postId;
        data.title = title;
        data.description = description;
        data.duration = duration;
        data.isComplete = true;
    }

    function verifySecret(bytes32 secretHash) external view returns (string memory title, string memory postId) {
        SecretData memory data = secrets[secretHash];
        require(data.isComplete, "Secret not fully associated");
        return (data.title, data.postId);
    }
}
