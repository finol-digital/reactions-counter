// TypeScript types for the reactions-counter action

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
  node: {
    items: {
      nodes: Array<{
        id: string
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

export interface GraphQLResponse<T> {
  data: T
}

export interface UpdateMutationResponse {
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
