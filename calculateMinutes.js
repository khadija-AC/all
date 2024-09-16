import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();
const authToken = process.env.authToken;
const owner = "khadija-AC";

// Ensure that you use UTC date strings
const startDate = Date.UTC(2024, 8, 1, 0, 0, 0);  // September 1, 2024 00:00:00 UTC
const endDate = Date.UTC(2024, 8, 30, 23, 59, 59);  // September 30, 2024 23:59:59 UTC

const octokit = new Octokit({ auth: authToken });

async function getJobDurations(jobsUrl) {
  const jobsResponse = await octokit.request(`GET ${jobsUrl}`);
  const jobs = jobsResponse.data.jobs;
  let totalDuration = 0;

  jobs.forEach(job => {
    const startTime = Date.parse(job.started_at);  // Parse the job start time as UTC
    const endTime = Date.parse(job.completed_at);  // Parse the job end time as UTC

    // Ensure the comparison is made using UTC timestamps
    if (startTime >= startDate && endTime <= endDate) {
      totalDuration += (endTime - startTime) / 60000;  // Convert to minutes
    }
  });

  return totalDuration;
}

async function getWorkflowUsage(owner, repo) {
  const response = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", { owner, repo, per_page: 100 });
  const workflowRuns = response.data.workflow_runs;
  let totalMinutes = 0;

  for (const run of workflowRuns) {
    const runCreatedAt = Date.parse(run.created_at);  // Parse as UTC

    if (runCreatedAt >= startDate && runCreatedAt <= endDate) {
      totalMinutes += await getJobDurations(run.jobs_url);
    }
  }

  return totalMinutes;
}

async function calculateTotalMinutes(owner) {
  const reposResponse = await octokit.request("GET /users/{owner}/repos", { owner, per_page: 100 });
  let grandTotalMinutes = 0;

  for (const repo of reposResponse.data) {
    const repoMinutes = await getWorkflowUsage(owner, repo.name);
    grandTotalMinutes += repoMinutes;
  }

  console.log(`Total Minutes: ${grandTotalMinutes.toFixed(2)}`);
  return grandTotalMinutes.toFixed(2);
}

(async () => {
  const grandTotalMinutes = await calculateTotalMinutes(owner);
  process.env.GRAND_TOTAL_MINUTES = grandTotalMinutes;
})();
