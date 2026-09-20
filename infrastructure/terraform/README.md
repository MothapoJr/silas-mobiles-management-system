# Infrastructure — Silas Mobiles Management System

Terraform for T08 of the WBS. Implements Section 9.1.12 (Cloud Architecture)
and the Deployment Plan in Section 9.1.10 of the Task 1 documentation
directly — module boundaries mirror the subgraphs in that section's
architecture diagram (EDGE / PUB / APP / DATA / SVC) on purpose, so the
diagram and the code can be read side by side in the Task 2 architecture
defence.

**This has not been run.** It was written against the documented
architecture and current (September 2026) AWS/Terraform conventions, but
nobody here has AWS credentials to `terraform apply` it. Budget time to run
`terraform validate` and `terraform plan`, read through what plan proposes,
and fix whatever the provider's actual current schema disagrees with before
it touches a real account — treat this as a strong first draft of T08, not
a finished one.

## Module map

| Module | Owns |
|---|---|
| `networking` | VPC, 3 subnet tiers × 2 AZs, IGW, single shared NAT Gateway |
| `security` | Security groups, GuardDuty, Secrets Manager (DB + JWT), EC2/CodeDeploy/GitHub-Actions IAM roles |
| `storage` | S3: static assets, uploads, CodeDeploy revisions |
| `database` | RDS PostgreSQL 15 |
| `compute` | ALB, launch template, ASG, CodeDeploy app + deployment group, ALB origin cert |
| `cdn` | CloudFront, WAF, public ACM cert, apex DNS, S3 OAC bucket policy |
| `notifications` | SES domain identity, DKIM, mail-from |
| `monitoring` | SNS alarm topic, CloudWatch alarms |

## One-time bootstrap (per AWS account, before the first `terraform init`)

The state bucket has to exist before Terraform can use it as a backend, so
it's created by hand once, outside Terraform:

```bash
for ENV in staging production; do
  aws s3api create-bucket \
    --bucket "silas-mobiles-tfstate-${ENV}" \
    --region af-south-1 \
    --create-bucket-configuration LocationConstraint=af-south-1

  aws s3api put-bucket-versioning \
    --bucket "silas-mobiles-tfstate-${ENV}" \
    --versioning-configuration Status=Enabled

  aws s3api put-bucket-encryption \
    --bucket "silas-mobiles-tfstate-${ENV}" \
    --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

  aws s3api put-public-access-block \
    --bucket "silas-mobiles-tfstate-${ENV}" \
    --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
done
```

No DynamoDB table is needed — locking uses Terraform's native S3 lock file
(`use_lockfile = true` in `backend.tf`), the recommended approach since
Terraform 1.10.

## Deploying an environment

```bash
cd infrastructure/terraform
terraform init -backend-config=environments/staging.backend.hcl
terraform validate
terraform plan  -var-file=environments/staging.tfvars
terraform apply -var-file=environments/staging.tfvars
```

Swap `staging` for `production` for the other environment. Because the
backend config is passed at `init` time, switching environments in the same
checkout means re-running `init` with the other `.backend.hcl` (Terraform
will offer to migrate state — say no, you want two *separate* state files,
not one migrated into the other).

## After `terraform apply`: manual steps Terraform cannot do for you

1. **Delegate the domain.** Copy the `route53_name_servers` output into
   whichever registrar `silasmobiles.co.za` (or `staging.silasmobiles.co.za`)
   is registered with, as NS records. Nothing under the domain resolves —
   including SES and ACM validation — until this propagates.
2. **Confirm the SNS subscription.** `alert_email` gets a one-time
   confirmation email from SNS; alarms silently don't deliver until it's
   clicked.
3. **Move SES out of the sandbox.** New AWS accounts can only send to
   *verified* addresses until you request production access (AWS Console →
   SES → Account dashboard → "Request production access"). This is a manual
   AWS review, not something Terraform can trigger.
4. **Set the GitHub Environment variables** (Settings → Environments →
   `staging` / `production` → Variables) from the root `terraform output`:

   | GitHub variable | Terraform output |
   |---|---|
   | `AWS_DEPLOY_ROLE_ARN` | `github_actions_role_arn` |
   | `DEPLOY_ARTIFACTS_BUCKET` | `deploy_artifacts_bucket_name` |
   | `STATIC_BUCKET` | `static_bucket_name` |
   | `CLOUDFRONT_DISTRIBUTION_ID` | `cloudfront_distribution_id` |
   | `API_BASE_URL` | `https://<domain_name>/api` |

5. **Add required reviewers to the `production` GitHub Environment** if you
   want the manual-approval gate mentioned in `CONTRIBUTING.md` — that's a
   repo setting, not something `cd.yml` can enforce by itself.

## Known trade-offs, on the record

- **Single NAT Gateway**, not one per AZ — halves the ~R650/month-per-gateway
  cost; the trade-off is a single point of failure for the app tier's
  *outbound* calls (SES, S3, npm during deploys) if that AZ has an outage.
  Inbound availability is unaffected — the ALB and ASG both still span both
  AZs. Worth revisiting once the client's traffic justifies the extra cost.
- **GuardDuty**: one detector per account per region. If GuardDuty is
  already enabled some other way in this AWS account (e.g. AWS
  Organizations delegated administration), delete the `aws_guardduty_detector`
  resource in `modules/security` before applying — a second one will fail.
- **Node.js 24, not the documented Node.js 20.** Node 20 reached end-of-life
  on 30 April 2026, over four months before this was written — running it
  in production from here would mean deploying an already-unsupported
  runtime on day one. Node 24 is the current Active LTS (moving to
  Maintenance LTS in October 2026, supported until April 2028). Recommend
  updating the Task 1 documentation's Deployment Plan (Section 9.1.10) to
  match before Task 3, so the doc and the system stay consistent.
- **Terraform AWS provider `~> 6.0`**, not `~> 5.0` — v6 is current as of
  September 2026. If `terraform init` pulls a version with renamed or
  removed arguments, `terraform validate` will say exactly which — that's
  expected review work, not a sign anything here is fundamentally wrong.
