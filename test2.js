import { Octokit } from "@octokit/rest";
import dotenv from 'dotenv';

dotenv.config();

const authToken = process.env.authToken;
const owner = "khadija-AC";  // Nom de l'utilisateur ou de l'organisation

// Créer une instance d'Octokit avec votre token
const octokit = new Octokit({
  auth: authToken
});

// Définir les dates de début et de fin pour septembre
const startDate = new Date("2024-09-01T00:00:00Z").getTime();
const endDate = new Date("2024-09-30T23:59:59Z").getTime();

// Fonction pour obtenir la durée d'exécution des jobs d'un workflow
async function getJobDurations(jobsUrl) {
  try {
    const jobsResponse = await octokit.request(`GET ${jobsUrl}`);
    const jobs = jobsResponse.data.jobs;
    let totalDuration = 0;

    jobs.forEach(job => {
      const startTime = new Date(job.started_at).getTime();
      const endTime = new Date(job.completed_at).getTime();

      // Filtrer les jobs qui se trouvent dans la plage du mois de septembre
      if (startTime >= startDate && endTime <= endDate) {
        totalDuration += (endTime - startTime) / 60000;  // Convertir en minutes
      }
    });

    return totalDuration;
  } catch (error) {
    console.error(`Erreur lors de la récupération des jobs : ${error.message}`);
    return 0;
  }
}

// Fonction pour obtenir les dépôts d'un utilisateur/organisation
async function getRepositories(owner) {
  try {
    const response = await octokit.request('GET /users/{owner}/repos', {
      owner,
      type: 'all',
      per_page: 100  // Nombre de dépôts à récupérer par page
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des dépôts: ${error.message}`);
    return [];
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
      const runCreatedAt = new Date(run.created_at).getTime();

      // Filtrer les runs dans la plage du mois de septembre
      if (runCreatedAt >= startDate && runCreatedAt <= endDate) {
        const runMinutes = await getJobDurations(run.jobs_url);
        console.log(`Workflow Run ID: ${run.id}, Duration: ${runMinutes.toFixed(2)} minutes`);
        totalMinutes += runMinutes;
      }
    }

    return totalMinutes;
  } catch (error) {
    console.error(`Erreur: ${error.message}`);
    return 0;
  }
}

// Fonction principale pour calculer l'utilisation totale des minutes pour tous les dépôts
async function calculateTotalMinutes(owner) {
  try {
    const repos = await getRepositories(owner);
    let grandTotalMinutes = 0;

    for (const repo of repos) {
      const repoName = repo.name;
      const repoMinutes = await getWorkflowUsage(owner, repoName);
      grandTotalMinutes += repoMinutes;
      console.log(`Total des minutes pour le dépôt ${repoName}: ${repoMinutes.toFixed(2)} minutes`);
    }

    // Sortie formatée pour GitHub Actions
    console.log(`::set-output name=grandTotalMinutes::${grandTotalMinutes.toFixed(2)}`);
  } catch (error) {
    console.error(`Erreur générale: ${error.message}`);
  }
}

// Exécuter le calcul
calculateTotalMinutes(owner);
