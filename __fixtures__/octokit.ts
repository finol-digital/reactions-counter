import { jest } from '@jest/globals'
import {
  GraphQLResponse,
  ProjectItemsQueryResponse,
  ProjectQueryResponse,
  UpdateMutationResponse
} from '../src/main'

export const mockProjectQueryResponse: ProjectQueryResponse = {
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

export const mockProjectItemsResponse: ProjectItemsQueryResponse = {
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
                number: 1
              }
            ]
          }
        }
      ]
    }
  }
}

export const mockUpdateMutationResponse: GraphQLResponse<UpdateMutationResponse> =
  {
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
  }

export class Octokit {
  options: {
    auth: string
  }

  constructor(options: { auth: string }) {
    this.options = options
  }

  graphql = jest.fn().mockImplementation(async (query: unknown) => {
    if (typeof query !== 'string') {
      throw new Error('Query must be a string')
    }
    let result
    if (query.includes('updateProjectItemFieldValue')) {
      result = mockUpdateMutationResponse
    } else if (query.includes('getProjectItems')) {
      result = mockProjectItemsResponse
    } else if (query.includes('getProject')) {
      result = mockProjectQueryResponse
      if (this.options.auth.includes('missing')) {
        result.repository.projectV2.fields.nodes = []
      }
      if (this.options.auth.includes('error')) {
        throw new Error('GraphQL Error')
      }
    } else {
      throw new Error(`Unexpected query: ${query}`)
    }
    return result
  })
}
