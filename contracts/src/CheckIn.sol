// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Daily check-in for Neon Breakout on Base
contract CheckIn {
    event CheckedIn(address indexed user, uint256 day, uint256 streak);

    mapping(address => uint256) public lastCheckInDay;
    mapping(address => uint256) public streak;

    function checkIn() external payable {
        require(msg.value == 0, "CheckIn: no ETH");

        uint256 today = block.timestamp / 1 days;
        require(lastCheckInDay[msg.sender] < today, "CheckIn: already today");

        uint256 newStreak = 1;
        uint256 prevDay = lastCheckInDay[msg.sender];
        if (prevDay > 0 && prevDay == today - 1) {
            newStreak = streak[msg.sender] + 1;
        }

        lastCheckInDay[msg.sender] = today;
        streak[msg.sender] = newStreak;

        emit CheckedIn(msg.sender, today, newStreak);
    }
}
