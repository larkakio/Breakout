// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CheckIn} from "../src/CheckIn.sol";

contract CheckInTest is Test {
    CheckIn internal checkIn;
    address internal alice = makeAddr("alice");

    function setUp() public {
        vm.warp(1_700_000_000);
        checkIn = new CheckIn();
    }

    function test_checkIn_emits_and_sets_streak() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit CheckIn.CheckedIn(alice, block.timestamp / 1 days, 1);
        checkIn.checkIn();

        assertEq(checkIn.lastCheckInDay(alice), block.timestamp / 1 days);
        assertEq(checkIn.streak(alice), 1);
    }

    function test_revert_same_day() public {
        vm.startPrank(alice);
        checkIn.checkIn();
        vm.expectRevert("CheckIn: already today");
        checkIn.checkIn();
        vm.stopPrank();
    }

    function test_revert_with_eth() public {
        vm.deal(alice, 1 ether);
        vm.expectRevert(bytes("CheckIn: no ETH"));
        vm.prank(alice);
        checkIn.checkIn{value: 1 wei}();
    }

    function test_streak_increments_next_day() public {
        vm.prank(alice);
        checkIn.checkIn();

        uint256 day = block.timestamp / 1 days;
        vm.warp((day + 1) * 1 days + 1);

        vm.prank(alice);
        checkIn.checkIn();
        assertEq(checkIn.streak(alice), 2);
    }

    function test_streak_resets_after_gap() public {
        vm.prank(alice);
        checkIn.checkIn();

        uint256 day = block.timestamp / 1 days;
        vm.warp((day + 2) * 1 days + 1);

        vm.prank(alice);
        checkIn.checkIn();
        assertEq(checkIn.streak(alice), 1);
    }
}
