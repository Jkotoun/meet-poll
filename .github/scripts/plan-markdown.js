const fs = require('fs');

const MAX_PLAN_LENGTH = 60000;

function planMarkdown(planFile) {
  if (!fs.existsSync(planFile)) {
    return 'Plan failed — see the job log.';
  }
  let plan = fs.readFileSync(planFile, 'utf8');
  if (plan.length > MAX_PLAN_LENGTH) {
    plan = `${plan.slice(0, MAX_PLAN_LENGTH)}\n… truncated, see the job log`;
  }
  return ['```', plan, '```'].join('\n');
}

module.exports = { planMarkdown };

if (require.main === module) {
  process.stdout.write(`${planMarkdown(process.argv[2])}\n`);
}
