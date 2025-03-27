/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, you can create fixtures that export mock
 * functions and objects. For example, the core module is mocked in this test,
 * so that the actual '@actions/core' module is not imported.
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mocks should be declared before the module being tested is imported.
jest.unstable_mockModule('@actions/core', () => core)
import {
  createMockGraphQL,
  mockProjectQueryResponse,
  mockProjectItemsResponse,
  mockUpdateMutationResponse
} from './helpers.js'

// The module being tested should be imported dynamically. This ensures that the
// mocks are used in place of any actual dependencies.
const { run } = await import('../src/main.js')

// Mock Octokit
const mockGraphQL = createMockGraphQL()

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    graphql: mockGraphQL
  }))
}))

describe('Reactions Counter Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token':
          return 'test-token'
        case 'project-url':
          return 'https://github.com/test-org/test-repo/projects/1'
        case 'field-name':
          return 'Reactions'
        default:
          return ''
      }
    })
  })

  it('should successfully update reaction counts', async () => {
    mockGraphQL
      .mockResolvedValueOnce(mockProjectQueryResponse)
      .mockResolvedValueOnce(mockProjectItemsResponse)
      .mockResolvedValueOnce(mockUpdateMutationResponse)

    await run()

    expect(core.setOutput).toHaveBeenCalledWith('status', 'success')
  })

  it('should handle invalid project URL', async () => {
    core.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'github-token':
          return 'test-token'
        case 'project-url':
          return 'invalid-url'
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
    mockGraphQL.mockResolvedValueOnce({
      repository: {
        projectV2: {
          id: 'project-1',
          fields: {
            nodes: [
              {
                id: 'field-1',
                name: 'Other Field',
                dataType: 'NUMBER'
              }
            ]
          }
        }
      }
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Field "Reactions" not found in project'
    )
  })

  it('should handle GraphQL errors', async () => {
    mockGraphQL.mockRejectedValueOnce(new Error('GraphQL Error'))

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('GraphQL Error')
  })

  it('should skip items without content', async () => {
    mockGraphQL
      .mockResolvedValueOnce(mockProjectQueryResponse)
      .mockResolvedValueOnce({
        node: {
          items: {
            nodes: [
              {
                id: 'item-1',
                content: null,
                fieldValues: {
                  nodes: []
                }
              }
            ]
          }
        }
      })

    await run()

    expect(core.setOutput).toHaveBeenCalledWith('status', 'success')
  })

  it('should not update unchanged values', async () => {
    mockGraphQL
      .mockResolvedValueOnce(mockProjectQueryResponse)
      .mockResolvedValueOnce({
        node: {
          items: {
            nodes: [
              {
                id: 'item-1',
                content: {
                  id: 'issue-1',
                  number: 1,
                  reactions: {
                    nodes: [{ content: '👍' }, { content: '❤️' }]
                  }
                },
                fieldValues: {
                  nodes: [
                    {
                      field: {
                        id: 'field-1',
                        name: 'Reactions',
                        dataType: 'NUMBER'
                      },
                      number: 2
                    }
                  ]
                }
              }
            ]
          }
        }
      })

    await run()

    expect(core.setOutput).toHaveBeenCalledWith('status', 'success')
    expect(mockGraphQL).toHaveBeenCalledTimes(2) // Only the first two queries, no update
  })
})
