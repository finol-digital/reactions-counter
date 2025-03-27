import { jest } from '@jest/globals'
import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import run from '../main.js'

// Mock @actions/core
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setOutput: jest.fn(),
  setFailed: jest.fn(),
  debug: jest.fn()
}))

const mockGetInput = jest.mocked(core.getInput)
const mockSetOutput = jest.mocked(core.setOutput)
const mockSetFailed = jest.mocked(core.setFailed)
const mockDebug = jest.mocked(core.debug)

// Mock Octokit
type GraphQLResponse<T> = { data: T }

interface ProjectQueryResponse {
  repository: {
    projectV2: {
      id: string
      fields: {
        nodes: Array<{
          id: string
          name: string
          dataType: string
        }>
      }
    }
  }
}

interface ProjectItemsQueryResponse {
  node: {
    items: {
      nodes: Array<{
        id: string
        contentId: string
        content: {
          id: string
          number: number
          reactions: {
            nodes: Array<{
              content: string
            }>
          }
        } | null
        fieldValues: {
          nodes: Array<{
            field: {
              id: string
              name: string
              dataType: string
            }
            number: number
          }>
        }
      }>
    }
  }
}

interface UpdateMutationResponse {
  updateProjectV2ItemFieldValue: {
    projectV2Item: {
      id: string
      fieldValues: {
        nodes: Array<{
          field: {
            id: string
            name: string
            dataType: string
          }
          number: number
        }>
      }
    }
  }
}

const mockGraphQL = jest.fn<
  (query: string, variables?: object) => Promise<GraphQLResponse<any>>
>()

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    graphql: mockGraphQL
  }))
}))

describe('Reactions Counter Action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetInput.mockImplementation((name: string) => {
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
      .mockResolvedValueOnce<GraphQLResponse<ProjectQueryResponse>>({
        data: {
          repository: {
            projectV2: {
              id: 'project-1',
              fields: {
                nodes: [
                  {
                    id: 'field-1',
                    name: 'Reactions',
                    dataType: 'NUMBER'
                  }
                ]
              }
            }
          }
        }
      })
      .mockResolvedValueOnce<GraphQLResponse<ProjectItemsQueryResponse>>({
        data: {
          node: {
            items: {
              nodes: [
                {
                  id: 'item-1',
                  contentId: 'issue-1',
                  content: {
                    id: 'issue-1',
                    number: 1,
                    reactions: {
                      nodes: [
                        { content: '👍' },
                        { content: '❤️' }
                      ]
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
                        number: 1
                      }
                    ]
                  }
                }
              ]
            }
          }
        }
      })
      .mockResolvedValueOnce<GraphQLResponse<UpdateMutationResponse>>({
        data: {
          updateProjectV2ItemFieldValue: {
            projectV2Item: {
              id: 'item-1',
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
          }
        }
      })

    await run()

    expect(mockSetOutput).toHaveBeenCalledWith('status', 'success')
  })

  it('should handle invalid project URL', async () => {
    mockGetInput.mockImplementation((name: string) => {
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

    expect(mockSetFailed).toHaveBeenCalledWith('Invalid project URL format. Expected: https://github.com/org/repo/projects/number')
  })

  it('should handle missing field', async () => {
    mockGraphQL.mockResolvedValueOnce<GraphQLResponse<ProjectQueryResponse>>({
      data: {
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
      }
    })

    await run()

    expect(mockSetFailed).toHaveBeenCalledWith('Field "Reactions" not found in project')
  })

  it('should handle GraphQL errors', async () => {
    mockGraphQL.mockRejectedValueOnce(new Error('GraphQL Error'))

    await run()

    expect(mockSetFailed).toHaveBeenCalledWith('GraphQL Error')
  })

  it('should skip items without content', async () => {
    mockGraphQL
      .mockResolvedValueOnce<GraphQLResponse<ProjectQueryResponse>>({
        data: {
          repository: {
            projectV2: {
              id: 'project-1',
              fields: {
                nodes: [
                  {
                    id: 'field-1',
                    name: 'Reactions',
                    dataType: 'NUMBER'
                  }
                ]
              }
            }
          }
        }
      })
      .mockResolvedValueOnce<GraphQLResponse<ProjectItemsQueryResponse>>({
        data: {
          node: {
            items: {
              nodes: [
                {
                  id: 'item-1',
                  contentId: 'issue-1',
                  content: null,
                  fieldValues: {
                    nodes: []
                  }
                }
              ]
            }
          }
        }
      })

    await run()

    expect(mockSetOutput).toHaveBeenCalledWith('status', 'success')
  })

  it('should not update unchanged values', async () => {
    mockGraphQL
      .mockResolvedValueOnce<GraphQLResponse<ProjectQueryResponse>>({
        data: {
          repository: {
            projectV2: {
              id: 'project-1',
              fields: {
                nodes: [
                  {
                    id: 'field-1',
                    name: 'Reactions',
                    dataType: 'NUMBER'
                  }
                ]
              }
            }
          }
        }
      })
      .mockResolvedValueOnce<GraphQLResponse<ProjectItemsQueryResponse>>({
        data: {
          node: {
            items: {
              nodes: [
                {
                  id: 'item-1',
                  contentId: 'issue-1',
                  content: {
                    id: 'issue-1',
                    number: 1,
                    reactions: {
                      nodes: [
                        { content: '👍' },
                        { content: '❤️' }
                      ]
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
        }
      })

    await run()

    expect(mockSetOutput).toHaveBeenCalledWith('status', 'success')
  })
})