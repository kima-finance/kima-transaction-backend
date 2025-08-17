# kima-transaction-backend — Quick Deploy (AWS App Runner)

Minimal, command-only flow. Works from an M1/M2 Mac but deploys linux/amd64 for App Runner.

## Confirm AWS account/region

```shell
aws sts get-caller-identity --query Account --output text

aws configure get region
# should print your target region (e.g., us-east-1)
```

## Ensure Docker Buildx exists (first time only)

```shell
docker buildx ls >/dev/null 2>&1 || docker buildx create --use --name kima-builder
```

### 1. Build (amd64) & push to ECR — per environment

**choose one: staging | testnet | mainnet**

```shell
ENV=staging
REGION=us-east-1
SERVICE=tx-backend-prerelease
REPO="$SERVICE-$ENV"                         
DOCKERFILE=Dockerfile.aws
TAG="$ENV"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REG="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
ECR_IMAGE="$REG/$REPO:$TAG"

# Create ECR repo if missing
aws ecr describe-repositories --repository-names "$REPO" --region "$REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO" --region "$REGION"

# Login to ECR
aws ecr get-login-password --region "$REGION" \
| docker login --username AWS --password-stdin "$REG"

# Build for linux/amd64 (even on Apple Silicon) and push
docker buildx build --platform linux/amd64 \
  -f "$DOCKERFILE" \
  -t "$ECR_IMAGE" \
  --push .

# (Optional) Verify architecture
docker buildx imagetools inspect "$ECR_IMAGE" | grep -A1 "Platform"
```

Repeat for ENV=testnet and ENV=mainnet.

### 2. Trigger the App Runner deploy (if auto-deploy is OFF)

```shell
REGION=us-east-1
ENV=staging
NAME="tx-backend-prerelease-$ENV"
SERVICE_ARN=$(aws apprunner list-services --region "$REGION" \
  --query "ServiceSummaryList[?ServiceName=='$NAME'].ServiceArn" --output text)

aws apprunner start-deployment --service-arn "$SERVICE_ARN" --region "$REGION"

# (Optional) Check status
aws apprunner describe-service --service-arn "$SERVICE_ARN" --region "$REGION" \
  --query 'Service.{Status:Status,Image:SourceConfiguration.ImageRepository.ImageIdentifier}'
```

If your App Runner service has Auto-deploy on image change enabled and tracks the same tag (e.g., :staging), pushing the image is enough.

### 3. Set environment variables & secrets (fast path)

Plain env vars (non-sensitive):
App Runner console → Your service → Configuration → Variables → Add, e.g.:

```shell
NODE_ENV=production

NETWORK=staging|testnet|mainnet
```

Any other non-secret config your app expects.

Secrets (passwords/tokens): store values in SSM Parameter Store (SecureString) or Secrets Manager, then reference them in App Runner → Secrets.

Create/update SSM parameters (per env):

```shell
REGION=us-east-1
SERVICE=tx-backend-prerelease
ENV=staging

# examples — rename to your keys
aws ssm put-parameter --region "$REGION" \
  --name "/$SERVICE/$ENV/DB_URL" \
  --type SecureString --value "postgres://user:pass@host:5432/db" --overwrite

aws ssm put-parameter --region "$REGION" \
  --name "/$SERVICE/$ENV/API_KEY" \
  --type SecureString --value "super-secret-token" --overwrite
```

Then in App Runner console → Variables & secrets:

Secrets → Add:

```
Key: DB_URL → Source: SSM parameter → Name: /$SERVICE/$ENV/DB_URL

Key: API_KEY → Source: SSM parameter → Name: /$SERVICE/$ENV/API_KEY
```

Save (this triggers a config deploy).

Repeat per environment by changing ENV.

### 4. Ultra-short repeat loop (all envs)

```shell
for ENV in staging testnet mainnet; do
  REGION=us-east-1
  SERVICE=tx-backend-prerelease
  REPO="$SERVICE-$ENV"
  TAG="$ENV"
  DOCKERFILE=Dockerfile.aws
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  REG="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"
  ECR_IMAGE="$REG/$REPO:$TAG"

  aws ecr describe-repositories --repository-names "$REPO" --region "$REGION" >/dev/null 2>&1 \
    || aws ecr create-repository --repository-names "$REPO" --region "$REGION"

  aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REG"

  docker buildx build --platform linux/amd64 -f ./docker/Dockerfile -t "$ECR_IMAGE" -f "$DOCKERFILE" --push .

  NAME="tx-backend-prerelease-$ENV"
  SERVICE_ARN=$(aws apprunner list-services --region "$REGION" \
    --query "ServiceSummaryList[?ServiceName=='$NAME'].ServiceArn" --output text)
  aws apprunner start-deployment --service-arn "$SERVICE_ARN" --region "$REGION" || true
done
```
