import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'

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

/**
 * The main function for the action.
 * Counts reactions on GitHub Issues and updates a corresponding GitHub Project with the count.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const projectUrl = core.getInput('project-url')
    const githubToken = core.getInput('github-token')
    const fieldName = core.getInput('field-name')

    // Initialize Octokit
    const octokit = new Octokit({ auth: githubToken })

    // Extract project number, organization, and repository from project URL
    const projectUrlMatch = projectUrl.match(
      /github\.com\/([^/]+)\/([^/]+)\/projects\/(\d+)/
    )
    if (!projectUrlMatch) {
      throw new Error(
        'Invalid project URL format. Expected: https://github.com/org/repo/projects/number'
      )
    }

    const [, org, repo, projectNumber] = projectUrlMatch

    // Get project ID
    const project = await octokit.graphql<ProjectQueryResponse>(
      `query getProject($org: String!, $repo: String!, $number: Int!) {
        repository(owner: $org, name: $repo) {
          projectV2(number: $number) {
            id
            fields(first: 100) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
                ... on ProjectV2IterationField {
                  id
                  name
                  dataType
                }
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  dataType
                }
              }
            }
          }
        }
      }`,
      {
        org,
        repo,
        number: parseInt(projectNumber, 10)
      }
    )

    // Add debugging
    core.debug(`Project response: ${JSON.stringify(project, null, 2)}`)

    if (!project?.repository?.projectV2) {
      throw new Error(
        'Failed to get project data. Response: ' + JSON.stringify(project)
      )
    }

    const projectId = project.repository.projectV2.id
    const fields = project.repository.projectV2.fields.nodes

    // Find the target field
    const targetField = fields.find((field) => field.name === fieldName)
    if (!targetField) {
      throw new Error(`Field "${fieldName}" not found in project`)
    }

    // Get project items
    const items = await octokit.graphql<ProjectItemsQueryResponse>(
      `query getProjectItems($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100) {
              nodes {
                id
                content {
                  ... on Issue {
                    id
                    number
                    reactions(first: 100) {
                      nodes {
                        content
                      }
                    }
                  }
                }
                fieldValues(first: 100) {
                  nodes {
                    ... on ProjectV2ItemFieldNumberValue {
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                          dataType
                        }
                      }
                      number
                    }
                    ... on ProjectV2ItemFieldTextValue {
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                          dataType
                        }
                      }
                      text
                    }
                    ... on ProjectV2ItemFieldDateValue {
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                          dataType
                        }
                      }
                      date
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                          dataType
                        }
                      }
                      optionId
                    }
                    ... on ProjectV2ItemFieldIterationValue {
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                          dataType
                        }
                      }
                      iterationId
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      {
        projectId
      }
    )

    const projectItems = items.node.items.nodes

    // Update each item with reaction count
    for (const item of projectItems) {
      if (!item.content) continue

      const issue = item.content
      const reactionCount = issue.reactions.nodes.length

      // Find the current value of the target field
      const currentValue = item.fieldValues.nodes.find(
        (value) => value.field?.name === fieldName
      )

      // Only update if the value has changed
      if (currentValue?.number !== reactionCount) {
        await octokit.graphql<GraphQLResponse<UpdateMutationResponse>>(
          `mutation updateProjectItemFieldValue($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: Float!) {
            updateProjectV2ItemFieldValue(
              input: {
                projectId: $projectId
                itemId: $itemId
                fieldId: $fieldId
                value: { number: $value }
              }
            ) {
              projectV2Item {
                id
                fieldValues(first: 100) {
                  nodes {
                    ... on ProjectV2ItemFieldNumberValue {
                      field {
                        ... on ProjectV2Field {
                          id
                          name
                          dataType
                        }
                      }
                      number
                    }
                  }
                }
              }
            }
          }`,
          {
            projectId,
            itemId: item.id,
            fieldId: targetField.id,
            value: reactionCount
          }
        )
      }
    }

    core.setOutput('status', 'success')
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
