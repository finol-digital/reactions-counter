import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import {
  ProjectQueryResponse,
  ProjectItemsQueryResponse,
  GraphQLResponse,
  UpdateMutationResponse
} from './types.js'

/**
 * Fetches all project fields with pagination
 */
async function fetchAllFields(
  octokit: Octokit,
  org: string,
  repo: string,
  projectNumber: number
): Promise<ProjectQueryResponse['repository']['projectV2']['fields']['nodes']> {
  const allFields: ProjectQueryResponse['repository']['projectV2']['fields']['nodes'] =
    []
  let cursor: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const project: ProjectQueryResponse =
      await octokit.graphql<ProjectQueryResponse>(
        `query getProject($org: String!, $repo: String!, $number: Int!, $cursor: String) {
        repository(owner: $org, name: $repo) {
          projectV2(number: $number) {
            id
            fields(first: 100, after: $cursor) {
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
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }`,
        {
          org,
          repo,
          number: projectNumber,
          cursor
        }
      )

    if (!project?.repository?.projectV2) {
      throw new Error(
        'Failed to get project data. Response: ' + JSON.stringify(project)
      )
    }

    allFields.push(...project.repository.projectV2.fields.nodes)
    hasNextPage = project.repository.projectV2.fields.pageInfo.hasNextPage
    cursor = project.repository.projectV2.fields.pageInfo.endCursor
  }

  return allFields
}

/**
 * Fetches all project items with pagination
 */
async function fetchAllProjectItems(
  octokit: Octokit,
  projectId: string
): Promise<ProjectItemsQueryResponse['node']['items']['nodes']> {
  const allItems: ProjectItemsQueryResponse['node']['items']['nodes'] = []
  let cursor: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const items: ProjectItemsQueryResponse =
      await octokit.graphql<ProjectItemsQueryResponse>(
        `query getProjectItems($projectId: ID!, $cursor: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100, after: $cursor) {
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
                      pageInfo {
                        hasNextPage
                        endCursor
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
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }`,
        {
          projectId,
          cursor
        }
      )

    allItems.push(...items.node.items.nodes)
    hasNextPage = items.node.items.pageInfo.hasNextPage
    cursor = items.node.items.pageInfo.endCursor
  }

  return allItems
}

/**
 * Fetches all reactions for an issue with pagination
 */
async function fetchAllReactions(
  octokit: Octokit,
  issueId: string,
  existingReactions: Array<{ content: string }>,
  hasNextPage: boolean,
  endCursor: string | null
): Promise<Array<{ content: string }>> {
  if (!hasNextPage) {
    return existingReactions
  }

  const allReactions = [...existingReactions]
  let cursor = endCursor
  let hasMore: boolean = hasNextPage

  while (hasMore) {
    const reactions = await octokit.graphql<{
      node: {
        reactions: {
          nodes: Array<{ content: string }>
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
        }
      }
    }>(
      `query getReactions($issueId: ID!, $cursor: String) {
        node(id: $issueId) {
          ... on Issue {
            reactions(first: 100, after: $cursor) {
              nodes {
                content
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }`,
      {
        issueId,
        cursor
      }
    )

    allReactions.push(...reactions.node.reactions.nodes)
    hasMore = reactions.node.reactions.pageInfo.hasNextPage
    cursor = reactions.node.reactions.pageInfo.endCursor
  }

  return allReactions
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

    // Get project ID and fields using pagination
    const fields = await fetchAllFields(
      octokit,
      org,
      repo,
      parseInt(projectNumber, 10)
    )

    // Find the target field
    const targetField = fields.find((field) => field.name === fieldName)
    if (!targetField) {
      throw new Error(`Field "${fieldName}" not found in project`)
    }

    // Get project ID from a simple query
    const projectIdQuery = await octokit.graphql<{
      repository: { projectV2: { id: string } }
    }>(
      `query getProjectId($org: String!, $repo: String!, $number: Int!) {
        repository(owner: $org, name: $repo) {
          projectV2(number: $number) {
            id
          }
        }
      }`,
      {
        org,
        repo,
        number: parseInt(projectNumber, 10)
      }
    )

    const projectId = projectIdQuery.repository.projectV2.id

    // Get all project items with pagination
    const projectItems = await fetchAllProjectItems(octokit, projectId)

    // Update each item with reaction count
    for (const item of projectItems) {
      if (!item.content) continue

      const issue = item.content

      // Get all reactions for this issue (handle pagination if needed)
      const allReactions = await fetchAllReactions(
        octokit,
        issue.id,
        issue.reactions.nodes,
        issue.reactions.pageInfo.hasNextPage,
        issue.reactions.pageInfo.endCursor
      )

      const reactionCount = allReactions.length

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
                  pageInfo {
                    hasNextPage
                    endCursor
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
