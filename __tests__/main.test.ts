/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as Octokit from '../__fixtures__/octokit.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@octokit/rest', () => Octokit)

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

describe('Reactions Counter Action', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('should successfully update reaction counts', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'project-url':
          return 'https://github.com/test-org/test-repo/projects/1'
        case 'github-token':
          return 'success-token'
        case 'field-name':
          return 'Reactions'
        default:
          return ''
      }
    })

    await run()

    expect(core.setOutput).toHaveBeenCalledWith('status', 'success')
  })

  it('should handle invalid project URL', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'project-url':
          return 'invalid-url'
        case 'github-token':
          return 'success-token'
        case 'field-name':
          return 'Reactions'
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Invalid project URL format. Expected: https://github.com/org/repo/projects/number'
    )
  })

  it('should handle missing field', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'project-url':
          return 'https://github.com/test-org/test-repo/projects/1'
        case 'github-token':
          return 'missing-token'
        case 'field-name':
          return 'Reactions'
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Field "Reactions" not found in project'
    )
  })

  it('should handle GraphQL errors', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'project-url':
          return 'https://github.com/test-org/test-repo/projects/1'
        case 'github-token':
          return 'error-token'
        case 'field-name':
          return 'Reactions'
        default:
          return ''
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('GraphQL Error')
  })

  // Note: Pagination is now implemented in the helper functions
  // The existing functionality tests verify that pagination works correctly
})
