pragma solidity 0.5.5;

contract BlockHash {

    mapping(uint256 => bytes32) blockHashes;
    mapping(uint256 => bytes32) blockHashesModulo256;

    constructor() public {

    }

    function get(uint256 blockNumber) external view returns (bytes32) {
        return blockHashes[blockNumber];
    }

    function getModulo256(uint256 blockNumber) external view returns (bytes32) {
        bytes32 blockHash = blockHashes[blockNumber];
        if(blockHash == 0) {
            blockHash = blockHashesModulo256[blockNumber];
        }
        return blockHash;
    }

    function save(uint256 blockNumber) external {
        require(blockNumber < block.number, "require past block");
        require(blockNumber > block.number - 256, "can't go past 256"); // TODO check: can we go up to block.number - 256 itself ?
        blockHashes[blockNumber] = blockhash(blockNumber);
    }

    function saveModulo256(uint256 blockNumber) external {
        require(blockNumber < block.number, "require past block");
        if(blockNumber > block.number - 256) { // TODO check: can we go up to block.number - 256 itself ?
            blockHashes[blockNumber] = blockhash(blockNumber);
        } else {
            uint256 actualBlockNumber = block.number-1; // TODO
            blockHashesModulo256[blockNumber] = blockhash(actualBlockNumber);
        }
    }

    event Test(bytes32 hashFor255, bytes32 hashfor256, bytes32 hashFor257);

    function test() external{
        emit Test(blockhash(block.number - 255), blockhash(block.number - 256), blockhash(block.number - 257));
    }

}