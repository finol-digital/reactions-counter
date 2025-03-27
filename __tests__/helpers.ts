import { jest } from '@jest/globals'

export type GraphQLResponse<T> = T

export interface ProjectQueryResponse {
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

export interface ProjectItemsQueryResponse {
  data: {
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
              number?: number
              text?: string
              date?: string
              optionId?: string
              iterationId?: string
            }>
          }
        }>
      }
    }
  }
}

export interface UpdateMutationResponse {
  data: {
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
}

export type GraphQLResponseType = GraphQLResponse<
  ProjectQueryResponse | ProjectItemsQueryResponse | UpdateMutationResponse
>

export const createMockGraphQL = () => {
  const mockGraphQL = jest.fn()
  mockGraphQL.mockImplementation(() =>
    Promise.resolve({} as GraphQLResponseType)
  )
  return mockGraphQL as jest.Mock<any>
}

export const mockProjectQueryResponse: GraphQLResponse<ProjectQueryResponse> = {
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

export const mockProjectItemsResponse: GraphQLResponse<ProjectItemsQueryResponse> =
  {
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
