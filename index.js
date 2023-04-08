import { readFileSync, writeFileSync } from "fs";
import { Octokit } from "octokit";

const githubRepositories = JSON.parse(
  readFileSync("./github_repositories.json")
);

const { GH_TOKEN = undefined } = process.env;

const octokit = new Octokit({
  auth: GH_TOKEN,
});

const saveIssues = (repos) =>
  writeFileSync("./github_repositories.json", JSON.stringify(repos), "utf-8");

const range = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => i);

const languages = async (owner, repo) => {
  const langs = (
    await octokit.request(`GET /repos/${owner}/${repo}/languages`, {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
  ).data;
  return Object.keys(langs);
};

const openIssuesCount = async (owner, repo) => {
  return (
    await octokit.request(`GET /repos/${owner}/${repo}`, {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
  ).data["open_issues_count"];
};

/** fetches a single page with a max of 100 issues. */
const issuesPerPage = async (owner, repo, page) =>
  (
    await octokit.request(`GET /repos/${owner}/${repo}/issues`, {
      owner,
      repo,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
      state: "open",
      per_page: 100,
      page,
    })
  ).data.filter((it) => it.labels.length > 0 && !it["pull_request"]);

const issues = async (owner, repo, issuesCount) => {
  const pagesNum = Math.ceil(issuesCount / 100);

  const pages = range(0, pagesNum).map((page) =>
    issuesPerPage(owner, repo, page + 1)
  );
  return (await Promise.all(pages))
    .flatMap((it) => it)
    .map((it) => ({
      title: it.title,
      body: it.body,
      html_url: it.html_url,
    }));
};

const fetchReposIssues = async () =>
  (
    await Promise.all(
      Object.keys(githubRepositories).map(async (it) => {
        const [org, repo] = it.split("/");
        const langs = await languages(org, repo);
        const issueCount = await openIssuesCount(org, repo);
        const repoIssues = await issues(org, repo, issueCount);
        return { org, repo, languages: langs, issues: repoIssues };
      })
    )
  ).reduce(
    (acc, it) => ({
      ...acc,
      [`${it.org}/${it.repo}`]: {
        languages: it.languages,
        issues: it.issues,
      },
    }),
    {}
  );

(async () => {
  saveIssues(await fetchReposIssues());
})();
