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
  graphql = jest.fn().mockImplementation(async (query: any) => {
    if (query.includes('updateProjectItemFieldValue')) {
      return mockUpdateMutationResponse
    }
    if (query.includes('getProjectItems')) {
      return mockProjectItemsResponse
    }
    if (query.includes('getProject')) {
      return mockProjectQueryResponse
    }
    throw new Error(`Unexpected query: ${query}`)
  })
  auth = async () => ({ type: 'token' })
}
