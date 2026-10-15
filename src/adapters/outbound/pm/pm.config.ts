/**
 * Platform-neutral wiring for the project-management adapters.
 *
 * ACTIVE_PLATFORM is the single place that reads PM_PLATFORM. Every module that
 * imports a platform module must use it: both platform modules bind the same
 * ports, and because Nest resolves tokens per import scope, a module importing
 * GitLabModule directly keeps talking to GitLab even when PM_PLATFORM=github —
 * one half of the application would run on the other platform, silently.
 */
export const ACTIVE_PLATFORM: 'github' | 'gitlab' =
  process.env.PM_PLATFORM === 'github' ? 'github' : 'gitlab';

/**
 * The configured project of the active platform. Bound by each platform module
 * from its own environment variable (GITLAB_PROJECT_PATH / GITHUB_PROJECT_PATH)
 * so that domain services need not know which platform is wired.
 */
export const PM_PROJECT_PATH = 'PM_PROJECT_PATH';
