// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "./interfaces/IAlgebraSwapRouter.sol";
import "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./interfaces/IUniswapV3Pool.sol";

import "hardhat/console.sol";

contract SimpleFlash {
    struct FlashCallbackData {
        address pool;
        address[3] tokens;
        uint24[3] fees;
        address[3] routers;
        uint8[3] types;
        uint256 amountIn;
        uint256 minProfit;
        address caller;
    }

    constructor() {}

    function flash(
        address pool,
        address[3] calldata tokens,
        uint24[3] calldata fees,
        address[3] calldata routers,
        uint8[3] calldata types,
        uint256 amountIn,
        uint256 minProfit
    ) external {
        bytes memory data = abi.encode(
            FlashCallbackData({
                pool: pool,
                tokens: tokens,
                fees: fees,
                routers: routers,
                types: types,
                amountIn: amountIn,
                minProfit: minProfit,
                caller: msg.sender
            })
        );
        uint256 amount0 = IUniswapV3Pool(pool).token0() == tokens[0]
            ? amountIn
            : 0;
        uint256 amount1 = IUniswapV3Pool(pool).token1() == tokens[0]
            ? amountIn
            : 0;
        IUniswapV3Pool(pool).flash(address(this), amount0, amount1, data);
    }

    function uniswapV3FlashCallback(
        // Pool fee x amount requested
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external {
        FlashCallbackData memory decoded = abi.decode(
            data,
            (FlashCallbackData)
        );
        address pool = decoded.pool;
        address token0 = IUniswapV3Pool(pool).token0();
        address token1 = IUniswapV3Pool(pool).token1();

        require(msg.sender == address(decoded.pool), "not authorized");

        uint256 amountOut1 = swapInputSingle(
            decoded.tokens[0],
            decoded.tokens[1],
            decoded.fees[0],
            decoded.routers[0],
            decoded.types[0],
            decoded.amountIn
        );
        uint256 amountOut2 = swapInputSingle(
            decoded.tokens[1],
            decoded.tokens[2],
            decoded.fees[1],
            decoded.routers[1],
            decoded.types[1],
            amountOut1
        );
        uint256 amountOut = swapInputSingle(
            decoded.tokens[2],
            decoded.tokens[0],
            decoded.fees[2],
            decoded.routers[2],
            decoded.types[2],
            amountOut2
        );

        console.log(
            amountOut > decoded.amountIn ? "---PROFIT--- %s" : "loss %s",
            amountOut
        );

        uint256 amount0 = token0 == decoded.tokens[0] ? decoded.amountIn : 0;
        uint256 amount1 = token1 == decoded.tokens[0] ? decoded.amountIn : 0;

        uint256 repayAmount0 = amount0 + fee0;
        uint256 repayAmount1 = amount1 + fee1;

        if (repayAmount0 > 0) {
            require(
                repayAmount0 + decoded.minProfit < amountOut,
                string.concat("NP ", Strings.toString(amountOut))
            );
            IERC20(token0).transfer(address(pool), repayAmount0);
            IERC20(token0).transfer(decoded.caller, amountOut - repayAmount0);
        }

        if (repayAmount1 > 0) {
            require(
                repayAmount1 + decoded.minProfit < amountOut,
                string.concat("NP ", Strings.toString(amountOut))
            );
            IERC20(token1).transfer(address(pool), repayAmount1);
            IERC20(token1).transfer(decoded.caller, amountOut - repayAmount1);
        }
    }

    function swapInputSingle(
        address _token0,
        address _token1,
        uint24 _fee,
        address _router,
        uint8 _type,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        TransferHelper.safeApprove(_token0, _router, amountIn);

        if (_type == 0) {
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: _token0,
                    tokenOut: _token1,
                    fee: _fee,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });

            // The call to `exactInputSingle` executes the swap.
            amountOut = ISwapRouter(_router).exactInputSingle(params);
        } else if (_type == 1) {
            IV3SwapRouter.ExactInputSingleParams memory params = IV3SwapRouter
                .ExactInputSingleParams({
                    tokenIn: _token0,
                    tokenOut: _token1,
                    fee: _fee,
                    recipient: address(this),
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });

            // The call to `exactInputSingle` executes the swap.
            amountOut = IV3SwapRouter(_router).exactInputSingle(params);
        } else {
            IAlgebraSwapRouter.ExactInputSingleParams
                memory params = IAlgebraSwapRouter.ExactInputSingleParams({
                    tokenIn: _token0,
                    tokenOut: _token1,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    limitSqrtPrice: 0
                });

            // The call to `exactInputSingle` executes the swap.
            amountOut = IAlgebraSwapRouter(_router).exactInputSingle(params);
        }
    }
}
