// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract TruthCast {
    struct TruthCastData {
        address creator;
        address user;
        string title;
        string description;
        uint256 duration;
    }

    mapping(bytes32 => TruthCastData) private secrets;

    string private constant SALT = "SOMERANDOMSECRET";
    function createSecret(
        address user,
        string memory title,
        string memory description,
        uint256 duration
    ) external returns (bytes32 secretHash) {
        secretHash = keccak256(
            abi.encodePacked(
                msg.sender,
                user,
                title,
                description,
                duration,
                SALT
            )
        );
        secrets[secretHash] = TruthCastData({
            creator: msg.sender,
            user: user,
            title: title,
            description: description,
            duration: duration
        });
        return secretHash;
    }
    function verifySecret(bytes32 secretHash)
        external
        view
        returns (address user, string memory title)
    {
        TruthCastData memory data = secrets[secretHash];
        require(data.user != address(0), "Secret not found");
        return (data.user, data.title);
    }
}
