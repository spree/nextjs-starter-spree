// Point @spree/sdk at a local checkout when SPREE_SDK_PATH is set.
//
// This is the JavaScript twin of the backend's SPREE_PATH: the branch installs
// the published SDK by default — for standalone clones and CI — and only swaps
// in a workspace build when a developer opts in through the environment. That
// keeps the local link out of package.json, so it can never be committed by
// accident.
//
// The Spree monorepo's worktree tooling sets SPREE_SDK_PATH to <worktree>/packages/sdk
// and runs the SDK's build in watch mode alongside `next dev`.
//
// `link:` rather than `file:` — pnpm symlinks the directory instead of copying
// it, so a rebuilt SDK is picked up without reinstalling.

const SDK_PACKAGE = '@spree/sdk'

/**
 * @param {{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }} pkg
 */
function readPackage(pkg) {
  const sdkPath = process.env.SPREE_SDK_PATH

  if (!sdkPath) return pkg

  for (const field of ['dependencies', 'devDependencies']) {
    if (pkg[field]?.[SDK_PACKAGE]) {
      pkg[field][SDK_PACKAGE] = `link:${sdkPath}`
    }
  }

  return pkg
}

module.exports = { hooks: { readPackage } }
