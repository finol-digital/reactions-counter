/**
 * Test to ensure TypeScript types remain centralized in types.ts
 * This prevents regression where types might be defined in implementation files
 */

import { readFile } from 'fs/promises'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('TypeScript Type Centralization', () => {
  it('should not have type definitions in main.ts', async () => {
    const mainTsPath = join(__dirname, '..', 'src', 'main.ts')
    const content = await readFile(mainTsPath, 'utf-8')

    // Check that main.ts doesn't contain type/interface definitions
    const typeDefinitionRegex = /^[^/]*\b(interface|type)\s+[A-Z]/gm
    const matches = content.match(typeDefinitionRegex)

    expect(matches).toBeNull()
  })

  it('should not have type definitions in index.ts', async () => {
    const indexTsPath = join(__dirname, '..', 'src', 'index.ts')
    const content = await readFile(indexTsPath, 'utf-8')

    // Check that index.ts doesn't contain type/interface definitions
    const typeDefinitionRegex = /^[^/]*\b(interface|type)\s+[A-Z]/gm
    const matches = content.match(typeDefinitionRegex)

    expect(matches).toBeNull()
  })

  it('should have all custom types in types.ts', async () => {
    const typesPath = join(__dirname, '..', 'src', 'types.ts')
    const content = await readFile(typesPath, 'utf-8')

    // Verify that types.ts contains the expected type definitions
    expect(content).toContain('export interface ProjectQueryResponse')
    expect(content).toContain('export interface ProjectItemsQueryResponse')
    expect(content).toContain('export interface GraphQLResponse')
    expect(content).toContain('export interface UpdateMutationResponse')
  })

  it('should have proper imports in main.ts', async () => {
    const mainTsPath = join(__dirname, '..', 'src', 'main.ts')
    const content = await readFile(mainTsPath, 'utf-8')

    // Verify that main.ts imports types from types.ts
    expect(content).toContain("from './types.js'")
    expect(content).toContain('ProjectQueryResponse')
    expect(content).toContain('ProjectItemsQueryResponse')
    expect(content).toContain('GraphQLResponse')
    expect(content).toContain('UpdateMutationResponse')
  })
})
