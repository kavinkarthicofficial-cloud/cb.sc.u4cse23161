
function knapsack(tasks, capacity) {
  const n = tasks.length;


  const dp = Array.from({ length: n + 1 }, () =>
    new Array(capacity + 1).fill(0)
  );


  for (let i = 1; i <= n; i++) {
    const task = tasks[i - 1];
    const duration = task.Duration;
    const impact = task.Impact;

    for (let w = 0; w <= capacity; w++) {

      dp[i][w] = dp[i - 1][w];


      if (duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - duration] + impact);
      }
    }
  }


  const selectedTasks = [];
  let remainingCapacity = capacity;

  for (let i = n; i > 0; i--) {
    if (dp[i][remainingCapacity] !== dp[i - 1][remainingCapacity]) {
      selectedTasks.push(tasks[i - 1]);
      remainingCapacity -= tasks[i - 1].Duration;
    }
  }

  const totalImpact = dp[n][capacity];
  const totalDuration = selectedTasks.reduce((sum, t) => sum + t.Duration, 0);

  return {
    selectedTasks: selectedTasks.reverse(),
    totalImpact,
    totalDuration,
    remainingCapacity: capacity - totalDuration,
  };
}

module.exports = { knapsack };
