import { useMemo } from 'react';

export interface DepthLevel {
    price: number;
    size: number;
    total: number;
}

export interface DepthScales {
    minPrice: number;
    maxPrice: number;
    priceRange: number;
    maxTotal: number;
    width: number;
    height: number;
    getX: (price: number) => number;
    getY: (total: number) => number;
    getPrice: (x: number) => number;
    getTotal: (y: number) => number;
}

export const useDepthScales = (
    bids: DepthLevel[],
    asks: DepthLevel[],
    width: number,
    height: number
): DepthScales => {
    return useMemo(() => {
        if (!bids.length || !asks.length) {
            return {
                minPrice: 0, maxPrice: 100, priceRange: 100, maxTotal: 100,
                width, height,
                getX: () => 0, getY: () => 0, getPrice: () => 0, getTotal: () => 0
            };
        }

        const minPrice = bids[bids.length - 1].price;
        const maxPrice = asks[asks.length - 1].price;
        const priceRange = maxPrice - minPrice;
        const maxTotal = Math.max(bids[bids.length - 1].total, asks[asks.length - 1].total);

        const getX = (price: number) => ((price - minPrice) / priceRange) * width;
        const getY = (total: number) => height - (total / maxTotal) * height;
        const getPrice = (x: number) => minPrice + (x / width) * priceRange;
        const getTotal = (y: number) => ((height - y) / height) * maxTotal;

        return {
            minPrice, maxPrice, priceRange, maxTotal,
            width, height,
            getX, getY, getPrice, getTotal
        };
    }, [bids, asks, width, height]);
};
