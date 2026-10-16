# infra/bootstrap

The minimum CI/CD needs before it can run Terraform: the state bucket, the
GitHub Actions Workload Identity Federation pool, the CI service accounts
and the project's APIs. CI can't create the identity it logs in with, so a
project owner applies this stack locally. State stays local (gitignored).

## Setup

```sh
gcloud auth application-default login   # as a project owner
gcloud auth application-default set-quota-project project-b4c68586-e430-4157-a61

cd infra/bootstrap
terraform init
terraform apply
```

Then initialize `infra/main`'s state once (the read-only PR planner can't
create it):

```sh
cd ../main && terraform init
```

Store the bootstrap outputs as GitHub repository variables:

| Variable           | Output                                                            |
| ------------------ | ----------------------------------------------------------------- |
| `GCP_PROJECT_ID`   | — (`terraform.tfvars`)                                            |
| `GCP_REGION`       | — (`terraform.tfvars`)                                            |
| `GCP_WIF_PROVIDER` | `workload_identity_provider`                                      |
| `GCP_PLANNER_SA`   | `planner_service_account`                                         |
| `GCP_TERRAFORM_SA` | `terraform_service_account`                                       |
| `GCP_DEPLOYER_SA`  | `deployer_service_account`                                        |
| `GCP_STATE_BUCKET` | `state_bucket`                                                    |
| `BACKEND_URL`      | `infra/main` output `service_urls.backend`, after its first apply |

## Service accounts

- `github-planner` — read-only; `terraform plan` on PRs from any branch.
- `github-terraform` — `terraform apply` of `infra/main`, including its IAM
  grants; only from jobs in the `prod` GitHub Environment, so every apply
  needs approval.
- `github-deployer` — pushes images and deploys Cloud Run revisions; only
  from jobs on `main`.
