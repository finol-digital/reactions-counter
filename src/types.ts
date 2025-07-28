// TypeScript types for the reactions-counter action

export interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

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
        pageInfo: PageInfo
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
            pageInfo: PageInfo
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
          pageInfo: PageInfo
        }
      }>
      pageInfo: PageInfo
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
        pageInfo: PageInfo
      }
    }
  }
}
