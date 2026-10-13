// Keeps one Terraform plan comment per PR up to date, so reviewers always see
// the plan for the latest push (or that it failed) instead of a stale one.
const fs = require('fs');

const MARKER = '<!-- terraform-plan:infra/main -->';
const LIMIT = 60000;

module.exports = async ({ github, context, planFile }) => {
  let plan = 'Plan failed — see the job log.';
  if (fs.existsSync(planFile)) {
    plan = fs.readFileSync(planFile, 'utf8');
  }
  if (plan.length > LIMIT) {
    plan = `${plan.slice(0, LIMIT)}\n… truncated, see the job log`;
  }

  // A fence longer than any backtick run in the plan can't be closed by it.
  const longestRun = Math.max(
    0,
    ...(plan.match(/`+/g) ?? []).map((r) => r.length),
  );
  const fence = '`'.repeat(Math.max(3, longestRun + 1));
  const sha = context.payload.pull_request.head.sha.slice(0, 7);
  const body = `${MARKER}\n### Terraform plan — \`infra/main\` (${sha})\n${fence}\n${plan}\n${fence}`;

  const { owner, repo } = context.repo;
  const issue_number = context.issue.number;
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
  });
  const existing = comments.find(
    (c) => c.user.login === 'github-actions[bot]' && c.body.startsWith(MARKER),
  );
  if (existing) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({ owner, repo, issue_number, body });
  }
};
