# Required GitHub Actions Secrets

Set these in: Settings → Secrets and variables → Actions

## AWS (required for all deployments)
| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user access key with EKS, ECR, RDS permissions |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `ECR_REGISTRY` | ECR registry URL e.g. `123456789.dkr.ecr.us-east-1.amazonaws.com` |
| `DB_PASSWORD` | PostgreSQL master password (used by Terraform) |

## Application (required for production)
| Secret | Description |
|--------|-------------|
| `SECRET_KEY` | JWT signing key — generate with `openssl rand -hex 32` |
| `OPENAI_API_KEY` | OpenAI API key for AI incident explanations (optional) |

## GitHub Environments
Create two environments in Settings → Environments:
- `staging` — auto-deploys on every push to `main`
- `production` — deploys on version tags (`v*`), requires manual approval

## IAM Policy (minimum required)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["ecr:*"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["eks:DescribeCluster", "eks:UpdateClusterConfig"], "Resource": "*" },
    { "Effect": "Allow", "Action": ["s3:*"], "Resource": ["arn:aws:s3:::kayo-terraform-state/*", "arn:aws:s3:::kayo-terraform-state"] },
    { "Effect": "Allow", "Action": ["dynamodb:*"], "Resource": "arn:aws:dynamodb:*:*:table/kayo-terraform-locks" },
    { "Effect": "Allow", "Action": ["ec2:*", "rds:*", "elasticache:*", "kafka:*", "iam:*", "kms:*"], "Resource": "*" }
  ]
}
```

## First-time setup order
1. Create IAM user with above policy, generate access keys
2. Add secrets to GitHub
3. Run `bash infrastructure/terraform/bootstrap.sh` to create S3 state bucket
4. Push to `main` — CI runs tests, Terraform provisions AWS, images build and deploy
5. Tag a release `git tag v1.0.0 && git push --tags` for production deploy
