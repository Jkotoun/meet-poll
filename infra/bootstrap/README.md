# infra/bootstrap

Identity and state for everything else: the Terraform state bucket, the
GitHub Actions Workload Identity Federation pool, and the two CI service
accounts. CI can't create the identity it authenticates with, so this stack
is applied **manually** by a project owner — once, and again only when it
changes.

## First-time setup

```sh
gcloud auth application-default login   # as a project owner
gcloud auth application-default set-quota-project project-b4c68586-e430-4157-a61

# The state bucket must exist before `terraform init`; the stack then adopts
# it via an import block and manages its settings from there on.
gcloud storage buckets create gs://project-b4c68586-e430-4157-a61-tfstate \
  --project=project-b4c68586-e430-4157-a61 \
  --location=europe-west1 \
  --uniform-bucket-level-access \
  --public-access-prevention

cd infra/bootstrap
terraform init
terraform apply
```

Then store the outputs as GitHub repository variables (they're identifiers,
not secrets):

| Variable           | Output                       |
| ------------------ | ---------------------------- |
| `GCP_PROJECT_ID`   | — (`terraform.tfvars`)       |
| `GCP_REGION`       | — (`terraform.tfvars`)       |
| `GCP_WIF_PROVIDER` | `workload_identity_provider` |
| `GCP_PLANNER_SA`   | `planner_service_account`    |
| `GCP_TERRAFORM_SA` | `terraform_service_account`  |
| `GCP_DEPLOYER_SA`  | `deployer_service_account`   |
| `GCP_STATE_BUCKET` | `state_bucket`               |

## Identities

- `github-planner` — read-only; runs `terraform plan` for `infra/main` on PRs
  from any branch.
- `github-terraform` — applies `infra/main`. Only jobs in the `prod` GitHub
  Environment can use it (bound to the OIDC subject
  `repo:<repo>:environment:prod`), so the Environment's required reviewer is
  an IAM boundary. No rights over service accounts, project IAM or APIs.
- `github-deployer` — pushes images and deploys Cloud Run revisions; only
  usable from `push` events on `main`.
- `run-<service>` — what each Cloud Run service runs as. Adding a service
  means adding it to `cloud_run_services` and re-applying this stack.

The pool only accepts tokens whose `repository_id` matches this repository,
so a renamed or re-created repository with the same name can't use it.
