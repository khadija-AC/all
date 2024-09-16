import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();
const authToken = process.env.authToken;
const owner = "khadija-AC";
const startDate = new Date("2024-09-01T00:00:00Z").getTime();
const endDate = new Date("2024-09-30T23:59:59Z").getTime();

const octokit = new Octokit({ auth: authToken });

async function getJobDurations(jobsUrl) {
  const jobsResponse = await octokit.request(`GET ${jobsUrl}`);
  const jobs = jobsResponse.data.jobs;
  let totalDuration = 0;
  jobs.forEach(job => {
    const startTime = new Date(job.started_at).getTime();
    const endTime = new Date(job.completed_at).getTime();
    if (startTime >= startDate && endTime <= endDate) {
      totalDuration += (endTime - startTime) / 60000;
    }
  });
  return totalDuration;
}

async function getWorkflowUsage(owner, repo) {
  const response = await octokit.request("GET /repos/{owner}/{repo}/actions/runs", { owner, repo, per_page: 100 });
  const workflowRuns = response.data.workflow_runs;
  let totalMinutes = 0;
  for (const run of workflowRuns) {
    const runCreatedAt = new Date(run.created_at).getTime();
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
