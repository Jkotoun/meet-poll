const fs = require('fs');

const MAX_PLAN_LENGTH = 60000;

function formatPlan(plan) {
  const text =
    plan.length > MAX_PLAN_LENGTH
      ? `${plan.slice(0, MAX_PLAN_LENGTH)}\n… truncated, see the job log`
      : plan;
  return ['```', text, '```'].join('\n');
}

module.exports = { formatPlan };

if (require.main === module) {
  const plan = fs.readFileSync(process.argv[2], 'utf8');
  process.stdout.write(`${formatPlan(plan)}\n`);
}
