/**
 * e.g:
 * 	
{
  "params": {
    "kimaNftClass": {
      "id": "KIMA_NFT",
      "name": "KIMA NFT",
      "symbol": "KIMA",
      "description": "KIMA RECIEPT FOR Liquidity Providers",
      "uri": "",
      "hash": ""
    },
    "epoch_length": "2",
    "liquidityProvisionMaxBTC": "0.050000000000000000",
    "liquidityProvisionMaxUSDT": "1000.000000000000000000",
    "transferLimitMaxBTC": "0.010000000000000000",
    "transferLimitMaxUSDT": "100.000000000000000000",
    "fiatTransactionParams": {
      "daca": "kima1jerkux87t3rzg2s0sc8sf04xmmlvxc9dxysejf"
    },
    "maxConcurrentTransactions": "5"
  }
}
 */
export interface BlockchainParamsResponseDto {
    params: {
        kimaNftClass: {
            id: string;
            name: string;
            symbol: string;
            description: string;
            uri: string;
            hash: string;
        };
        epoch_length: string;
        liquidityProvisionMaxBTC: string;
        liquidityProvisionMaxUSDT: string;
        transferLimitMaxBTC: string;
        transferLimitMaxUSDT: string;
        fiatTransactionParams: {
            daca: string;
        };
        maxConcurrentTransactions: string;
    };
}
