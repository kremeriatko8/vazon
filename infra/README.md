# Vazon infrastructure

> **Status: PLANNED.** This is only a plan. No AWS resources, accounts or paid services exist for Vazon. Nothing here has been deployed. Today Vazon runs locally with Docker Compose (see the root `README.md`).

This document describes how Vazon could be deployed to AWS later. Use it to discuss the plan as a team before anyone creates resources.

## Overview

```
Browser
  │
  ├──► CloudFront ──► S3 bucket (frontend static build)
  │
  └──► Backend container (ECS Fargate or App Runner)  /api/v1
            │                  │
            ▼                  ▼
     RDS for PostgreSQL   Secrets Manager
```

| Part | Planned service | Docker image? |
| --- | --- | --- |
| Frontend | S3 + CloudFront | No (static files) |
| Backend | ECS Fargate or App Runner | Yes |
| Database | Amazon RDS for PostgreSQL | No (managed) |
| Secrets | AWS Secrets Manager | No |
| Infrastructure as code | Terraform, if justified; otherwise CloudFormation | No |

## Frontend: S3 + CloudFront

- **Why it helps:** the React app builds (`npm run build`) to static files. S3 stores them cheaply, and CloudFront serves them over HTTPS from edge locations, with caching.
- **How it connects:** CloudFront reads from a private S3 bucket through Origin Access Control. The browser calls the backend at the URL set in `VITE_API_URL` during the build. For client-side routes from React Router, CloudFront has to return `index.html` for unknown paths.
- **Docker images:** none. Only the files in `frontend/dist` are uploaded.
- **Deployment steps:**
  1. `npm ci && npm run build` in `frontend/`, with `VITE_API_URL` set to the production API URL.
  2. Upload `frontend/dist` to the S3 bucket.
  3. Invalidate the CloudFront cache.
- **Cost and cost controls:** for a demo, this is usually close to the free tier. Keep a single bucket, use long cache lifetimes for hashed assets, and set an AWS Budgets alert.
- **Security:** block all public access to the bucket and allow only CloudFront to read it. Enforce HTTPS, and add security headers through a CloudFront response headers policy.
- **Simpler option for the demo:** S3 + CloudFront is already simple. Hosting the frontend on Netlify, Vercel or GitHub Pages would be even simpler, but it would mean using a non-AWS service.

## Backend: container on ECS Fargate or App Runner

- **Why it helps:** the NestJS API already runs in a Docker container locally. A managed container service runs the same image without anyone managing servers.
- **How it connects:** the image goes to Amazon ECR. The service pulls it, runs it, and exposes `/api/v1` over HTTPS. It connects to RDS inside a VPC and reads `DATABASE_URL` and other secrets from Secrets Manager. The CORS setting must allow the CloudFront domain.
- **Docker images:** yes. Build the image from `backend/Dockerfile` and push it to ECR.
- **Deployment steps:**
  1. Build the image and tag it with the git commit SHA.
  2. Push it to ECR.
  3. Run `npx prisma migrate deploy` against RDS as a one-off task, before switching traffic.
  4. Update the service to the new image tag. Check `GET /api/v1/health`.
- **Cost and cost controls:**
  - **App Runner:** you pay for active compute and provisioned memory. It can scale down when idle. Its setup is the simplest.
  - **ECS Fargate:** you pay per vCPU and GB per second while tasks run. A load balancer adds a fixed monthly cost.
  - For both: use the smallest task size and a single instance. Stop the service when the demo is not needed, and set a Budgets alert.
- **Security:** run the container as a non-root user. Use an IAM task role with least privilege, and keep secrets in Secrets Manager, never in the image. Restrict the database security group to the backend only, and use HTTPS only.
- **Simpler alternatives:**
  - **App Runner** instead of ECS Fargate: no load balancer, cluster or task definitions to manage. This is the recommended choice for a university demo.
  - **Lightsail containers:** a fixed monthly price and a very simple setup.
  - **A single EC2 instance running Docker Compose:** the closest to local development, but you patch and maintain the server yourself.
- **Simpler option for the demo:** App Runner.

## Database: Amazon RDS for PostgreSQL

- **Why it helps:** managed PostgreSQL with automated backups, patching and monitoring. It matches the local `postgres` container and Prisma.
- **How it connects:** the database is in private subnets and is reachable only from the backend service. The connection string is stored in Secrets Manager as `DATABASE_URL`. Prisma migrations run with `prisma migrate deploy`.
- **Docker images:** none. RDS is a managed service.
- **Deployment steps:**
  1. Create a small instance in private subnets.
  2. Store the credentials in Secrets Manager.
  3. Run `prisma migrate deploy` from the backend deployment.
- **Cost and cost controls:** this is usually the largest fixed cost. Use the smallest burstable instance class (free-tier eligible if the account qualifies), a single AZ, minimal storage and short backup retention. Stop the instance between demos (RDS starts stopped instances again after 7 days).
- **Security:** no public access. Enable encryption at rest, require TLS for connections, use a strong generated password, and restrict the security group to the backend.
- **Simpler option for the demo:** a single-AZ micro instance is enough. A free-tier managed PostgreSQL from another provider is possible, but it would move the database off AWS.

## Secrets: AWS Secrets Manager

- **Why it helps:** it keeps `DATABASE_URL`, the JWT signing secret and other credentials out of the code, the images and CI logs.
- **How it connects:** the backend service's IAM role can read only Vazon's secrets. The secrets are injected into the container as environment variables at start-up.
- **Docker images:** none.
- **Deployment steps:**
  1. Create one secret per value, or one JSON secret.
  2. Grant the service role `secretsmanager:GetSecretValue` on those secrets only.
  3. Reference the secrets in the service configuration.
- **Cost and cost controls:** a small monthly fee per secret, plus API calls. Keep the number of secrets small. SSM Parameter Store (SecureString) is a free-tier alternative.
- **Security:** least-privilege IAM. Turn on rotation for database credentials where possible. Never print secrets in logs.
- **Simpler option for the demo:** SSM Parameter Store SecureString parameters are cheaper and good enough.

## Infrastructure as code: Terraform or CloudFormation

- **Why it helps:** the infrastructure is reviewable in pull requests, repeatable, and can be destroyed completely after the demo, which also controls cost.
- **Terraform:** widely used and works across providers. It needs a remote state backend (an S3 bucket with locking) and one more tool to learn.
- **CloudFormation:** native to AWS, with no state to manage and no extra tooling. Templates are more verbose.
- **Recommendation:** use Terraform only if someone on the team already knows it, or the course asks for it. Otherwise, use CloudFormation.
- **Docker images:** none. IaC only defines where the images run.
- **Cost:** both tools are free. The only cost is the resources they create.
- **Security:** never commit state files, credentials or account IDs. Review plans before applying.
- **Simpler option for the demo:** creating the resources by hand in the console is fastest for a one-off demo, but harder to reproduce and clean up.

## Recommended setup for the university demo

App Runner (backend), RDS for PostgreSQL single-AZ micro (database), S3 + CloudFront (frontend), and Parameter Store or Secrets Manager (secrets). Add an AWS Budgets alert before creating anything, and tear everything down after the demo.

## Open questions

- [ ] **Budget limit:** the monthly maximum we are willing to spend, and who receives the alerts.
- [ ] **Region:** which AWS region to use (for example, one close to Ukraine, such as `eu-central-1`).
- [ ] **Domain name:** use a custom domain, or the default CloudFront and App Runner URLs.
- [ ] **AWS account owner:** who owns the AWS account and the billing, and how teammates get access (IAM Identity Center, no shared root login).
- [ ] **Infrastructure as code:** Terraform or CloudFormation.
- [ ] **Backend service:** App Runner or ECS Fargate.
