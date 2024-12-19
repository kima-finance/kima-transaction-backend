# Kima Transaction Backend

A web server that works as a middleware between Kima Transaction Widget and Kima Chain.
Once it receives a transaction request from the frontend (Kima Transaction Widget), it will submit a transaction to Kima Chain using pre-defined wallet's private key and returns transaction id to the frontend.
This wallet is called Developer Wallet, and it should have enough KIMA token to pay gas fee.

## Usage

1. Create a `.env` file
2. Copy the values from `.env.sample` into your `.env` and fill in the values
3. To run locally: `npm run dev`
4. Otherwise build the `docker-compose` and run it
5. Use `docker-compose.yml` for dev, `docker-compose-prod.yml` for prod

## Available Routes

See OpenAPI documentation at `/docs` for more details (only available when `NODE_ENV` is `development`). The following is an overview of how the routes are used together.

- Get various info for the frontend from `/chains/*` like supported chains, tokens, pool addresses, etc.
- `GET /submit/fee`: get the fees. Use this to determine the total amount for the ERC20 approval. The approval must be completed before submitting the transaction or the transfer will fail.
- `POST /submit`: submit will initiate the Kima Transaction and return a transaction id that can be used to monitor the status of the transaction
- `GET /tx/{txId}/status`: use the transaction id from submit to get the transaction status

### Optional Routes

#### `GET /compliant`:

If enabled by suppling the `COMPLIANCE_URL` environment variable, this route will check if an address meets compliance requirements- is not sanctioned, blocked, etc.

Use this in the frontend to notify the user an address is not compliant BEFORE doing the ERC20 approval. When compliance is enabled, the `/submit` endpoint will return status `403` (Forbidden) if an address is not compliant.

#### `POST /kyc`:

Returns the KYC status for a specific `uuid` verification session. You can use `GET /uuid` to get a new `uuid`.
