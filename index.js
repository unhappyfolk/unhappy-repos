import { Octokit } from "octokit";

const octokit = new Octokit({
  // auth: 'YOUR-TOKEN'
});
const QURAN_ORG = "quran";
const quran_android = `quran_android`;

/** fetches a single page with a max of 100 issues. */
const issues = (owner, repo, page) =>
  octokit.request(`GET /repos/${owner}/${repo}/issues`, {
    owner,
    repo,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
    state: "open",
    per_page: 100,
    page,
  });

/** @deprecated no longer needed */
const labelsInPage = async (owner, repo, page) =>
  (await issues(owner, repo, page)).data
    .filter((it) => it.labels.length > 0)
    .flatMap((it) => it.labels)
    .map((it) => it.name);

const fetchLabels = (owner, repo) =>
  octokit.request(`GET /repos/${owner}/${repo}/labels`, {
    owner,
    repo,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
    state: "open",
    per_page: 100,
  });

const labels = async (owner, repo) =>
  (await fetchLabels(owner, repo)).data.map((it) => it.name);

console.log(await labels("nuqayah", "deen-projects"));

//

/* quran_android labels
[
          'Data',
  'dependencies', 'Improvement',
  'In progress',  'Inquiry',
  'Major',        'Minor',
  'New Feature',  'PRs Welcome',
  'Suggestions'
]
*/

/* nuqayah labels
[
  
level1: 'urgency: 3', 'priority: high'
level2: 'urgency: 2'
level3: 'urgency: 1'
]
*/
