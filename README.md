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

- `POST /auth` :

  The `Kima Transaction Widget` calls this endpoint before it submits a transaction request.
  Returns [`JWT`](https://jwt.io/) as cookie which has 5 seconds of life time. This cookie will be expired after 5 seconds. `Kima Transaction Widget` calls then calls `/auth` right after it receives `JWT Auth Token`.

- `POST /submit`:

  1. Validates the `JWT Auth Token` sent as cookie from the frontend.
  2. Submits a transaction to Kima Chain using the backend wallet.
  3. Returns the transaction id to the frontend so that it starts monitoring it's status.

### Optional Routes

#### `GET /compliant`:

If enabled by suppling the `COMPLIANCE_URL` environment variable, this route will check if the address meets compliance requirements- is not sanctioned, blocked, etc.

The following endpoints will return status `403` if the address is not compliant:

- `POST /htlc`
- `POST /submit`

#### `POST /kyc`:

Returns the KYC status for a specific `uuid` verification session.
