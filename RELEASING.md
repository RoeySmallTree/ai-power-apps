# Source releases

Repository tags do not require bumping unchanged Claude, Gemini, Cursor or SDK versions.
The SDK remains source-distributed; these steps do not publish anything to npm.

1. Review the exact source inventory and public/private boundary, then pass SDK type/retry,
   packed-consumer/sample, Python and manifest CI on the candidate branch.
2. Refresh `git fetch origin main --tags`. Pick the next unused repository tag and update the
   README's `git clone --branch` command to that exact tag; review the final candidate.
3. Merge the reviewed candidate. In a clean checkout of the resulting public main, run
   `node scripts/check-release.mjs v1.0.4` (replace the argument with the chosen tag).
   This fetches tags again, refuses an existing tag, requires clean current main and checks the
   README command matches. If a concurrent release took the tag, revise/review the README;
   never move or replace the existing tag.
4. Immediately tag that reviewed commit and publish the tag/release through the authorized
   release workflow. Record the commit, tag and CI result.
5. Fresh-clone the exact public tag and repeat the README source-install and sample workflow.
   Recheck public readability and the packed consumer before linking it from the service docs.

Record the served schema hash, its `info` contract/version fields, generation time, Node and
compiler versions, tarball filename/hash, package file-list assertion and consumer results in
the private release evidence. Published source must not contain credentials or private service
implementation. Live sample acceptance uses a disposable Free-account key and records cleanup.
