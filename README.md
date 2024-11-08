# Kima Transaction Backend

A web server that works as a middleware between Kima Transaction Widget and Kima Chain.
Once it receives a transaction request from the frontend (Kima Transaction Widget), it will submit a transaction to Kima Chain using pre-defined wallet's private key and returns transaction id to the frontend.
This wallet is called Developer Wallet, and it should have enough KIMA token to pay gas fee.

## Usage

1. Create a `.env` file
2. Fill in parameters:
   ```env.smaple
   PORT=3001 <or any other port>
   KIMA_BACKEND_MNEMONIC=<developer wallet's mnemonic>
   KIMA_BACKEND_SECRET=<secret for jwt>
   KIMA_BACKEND_NODE_PROVIDER=rpc_testnet.kima.finance
   XPLORISK_URL=<xplorisk lambda function endpoint>
   ```
3. To run locally: `npm run dev`
4. Otherwise build the `docker-compose` and run it
5. Use `docker-compose.yml` for dev, `docker-compose-prod.yml` for prod

## Available Routes

- `/auth` :

  The `Kima Transaction Widget` calls this endpoint before it submits a transaction request.
  Returns [`JWT`](https://jwt.io/) as cookie which has 5 seconds of life time. This cookie will be expired after 5 seconds. `Kima Transaction Widget` calls second endpoint right after it receives `JWT Auth Token`.

- `/submit`:

  1. Validate `JWT Auth Token` which has sent as cookie from the frontend.
  2. Submit a transaction to Kima Chain using `Developer Wallet`.
  3. Return transaction id to the frontend so that it starts monitoring it's status.

- `/compliant`:
  `Request parameter`: wallet address to check compliant
  `Response`: `ok` if address is compliant, `fail` if address is non-compliant
