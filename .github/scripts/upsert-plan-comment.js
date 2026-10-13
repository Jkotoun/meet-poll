const fs = require('fs');
const { formatPlan } = require('./plan-markdown.js');

const MARKER = '<!-- terraform-plan:infra/main -->';

function readPlan(planFile) {
  if (!fs.existsSync(planFile)) {
    return 'Plan failed — see the job log.';
  }
  return fs.readFileSync(planFile, 'utf8');
}

function renderComment(plan, sha) {
  return [
    MARKER,
    `### Terraform plan — \`infra/main\` (${sha.slice(0, 7)})`,
    formatPlan(plan),
  ].join('\n');
}

async function findPlanComment(github, issue) {
  const comments = await github.paginate(
    github.rest.issues.listComments,
    issue,
  );
  return comments.find(
    (c) => c.user.login === 'github-actions[bot]' && c.body.startsWith(MARKER),
  );
}

module.exports = async ({ github, context, planFile }) => {
  const issue = { ...context.repo, issue_number: context.issue.number };
  const body = renderComment(
    readPlan(planFile),
    context.payload.pull_request.head.sha,
  );

  const existing = await findPlanComment(github, issue);
  if (existing) {
    await github.rest.issues.updateComment({
      ...context.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({ ...issue, body });
  }
};
