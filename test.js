import { Octokit } from "@octokit/rest";
const owner = "khadija-AC";  // Remplacez par le nom de l'utilisateur ou de l'organisation
const repo = "self-hosted-runner-with-aws";  // Remplacez par le nom du dépôt

require('dotenv').config();
const authToken = process.env.authToken;
// Remplacez par votre token GitHub


// Créer une instance d'Octokit avec votre token
const octokit = new Octokit({
    auth: authToken
  });
  
  // Fonction pour obtenir la durée d'exécution des jobs d'un workflow
  async function getJobDurations(jobsUrl) {
    try {
      const jobsResponse = await octokit.request(`GET ${jobsUrl}`);
      const jobs = jobsResponse.data.jobs;
      let totalDuration = 0;
  
      jobs.forEach(job => {
        const startTime = new Date(job.started_at).getTime();
        const endTime = new Date(job.completed_at).getTime();
        totalDuration += (endTime - startTime) / 60000;  // Convertir en minutes
      });
  
      return totalDuration;
    } catch (error) {
      console.error(`Erreur lors de la récupération des jobs : ${error.message}`);
      return 0;
    }
  }
  
  // Fonction pour obtenir l'utilisation des minutes d'actions GitHub
  async function getWorkflowUsage(owner, repo) {
    try {
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/actions/runs', 
        {
          owner,
          repo,
          per_page: 100  // Pour récupérer jusqu'à 100 workflows à la fois
        }
      );
  
      const workflowRuns = response.data.workflow_runs;
  
      // Calcul total des minutes
      let totalMinutes = 0;
  
      for (const run of workflowRuns) {
        const runMinutes = await getJobDurations(run.jobs_url);
        console.log(`Workflow Run ID: ${run.id}, Duration: ${runMinutes.toFixed(2)} minutes`);
        totalMinutes += runMinutes;
      }
  
      console.log(`Total des minutes utilisées pour le repo ${repo}: ${totalMinutes.toFixed(2)} minutes`);
  
    } catch (error) {
      console.error(`Erreur: ${error.message}`);
    }
  }
  
  // Exemple : nom d'utilisateur et dépôt
  getWorkflowUsage(owner, repo);