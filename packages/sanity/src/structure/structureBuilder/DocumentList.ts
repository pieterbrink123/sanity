import {generateHelpUrl} from '@sanity/generate-help-url'
import {AddIcon} from '@sanity/icons'
import {type SchemaType, type SortOrderingItem} from '@sanity/types'
import {DEFAULT_STUDIO_CLIENT_OPTIONS, type InitialValueTemplateItem} from 'sanity'

import {type ChildResolver, type ChildResolverOptions, type ItemChild} from './ChildResolver'
import {DocumentBuilder} from './Document'
import {
  type BuildableGenericList,
  type GenericList,
  GenericListBuilder,
  type GenericListInput,
} from './GenericList'
import {HELP_URL, SerializeError} from './SerializeError'
import {type Child, type SerializeOptions} from './StructureNodes'
import {type StructureContext} from './types'
import {resolveTypeForDocument} from './util/resolveTypeForDocument'

const validateFilter = (spec: PartialDocumentList, options: SerializeOptions) => {
  const filter = spec.options?.filter.trim() || ''

  if (['*', '{'].includes(filter[0])) {
    throw new SerializeError(
      `\`filter\` cannot start with \`${filter[0]}\` - looks like you are providing a query, not a filter`,
      options.path,
      spec.id,
      spec.title,
    ).withHelpUrl(HELP_URL.QUERY_PROVIDED_FOR_FILTER)
  }

  return filter
}

const createDocumentChildResolverForItem =
  (context: StructureContext): ChildResolver =>
  (itemId: string, options: ChildResolverOptions): ItemChild | Promise<ItemChild> | undefined => {
    const parentItem = options.parent as DocumentList
    const template = options.params?.template
      ? context.templates.find((tpl) => tpl.id === options.params.template)
      : undefined
    const type = template
      ? template.schemaType
      : parentItem.schemaTypeName || resolveTypeForDocument(context.getClient, itemId)

    return Promise.resolve(type).then((schemaType) =>
      schemaType
        ? context.resolveDocumentNode({schemaType, documentId: itemId})
        : new DocumentBuilder(context).id('editor').documentId(itemId).schemaType(''),
    )
  }

/**
 * Partial document list
 *
 * @public
 */
export interface PartialDocumentList extends BuildableGenericList {
  /** Document list options. See {@link DocumentListOptions} */
  options?: DocumentListOptions
  /** Schema type name */
  schemaTypeName?: string
}

/**
 * Interface for document list input
 *
 * @public
 */
export interface DocumentListInput extends GenericListInput {
  /** Document list options. See {@link DocumentListOptions} */
  options: DocumentListOptions
}

/**
 * Interface for document list
 *
 * @public
 */
export interface DocumentList extends GenericList {
  type: 'documentList'
  /** Document list options. See {@link DocumentListOptions} */
  options: DocumentListOptions
  /** Document list child. See {@link Child} */
  child: Child
  /** Document schema type name */
  schemaTypeName?: string
}

/**
 * Interface for document List options
 *
 * @public
 */
export interface DocumentListOptions {
  /** Document list filter */
  filter: string
  /** Document list parameters */
  params?: Record<string, unknown>
  /** Document list API version */
  apiVersion?: string
  /** Document list API default ordering array. */
  defaultOrdering?: SortOrderingItem[]
}

/**
 * Class for building document list
 *
 * @public
 */
export class DocumentListBuilder extends GenericListBuilder<
  PartialDocumentList,
  DocumentListBuilder
> {
  /** Document list options. See {@link PartialDocumentList} */
  protected spec: PartialDocumentList

  protected _context: StructureContext

  constructor(
    /**
     * Structure context. See {@link StructureContext}
     */
    _context: StructureContext,
    spec?: DocumentListInput,
  ) {
    super()
    this._context = _context
    this.spec = spec || {}
    this.initialValueTemplatesSpecified = Boolean(spec?.initialValueTemplates)
  }

  /** Set API version
   * @param apiVersion - API version
   * @returns document list builder based on the options and API version provided. See {@link DocumentListBuilder}
   */
  apiVersion(apiVersion: string): DocumentListBuilder {
    return this.clone({options: {...(this.spec.options || {filter: ''}), apiVersion}})
  }

  /** Get API version
   * @returns API version
   */
  getApiVersion(): string | undefined {
    return this.spec.options?.apiVersion
  }

  /** Set Document list filter
   * @param filter - GROQ-filter used to determine which documents to display. Do not support joins, since they operate on individual documents, and will ignore order-clauses and projections. See {@link https://www.sanity.io/docs/realtime-updates}
   * @returns document list builder based on the options and filter provided. See {@link DocumentListBuilder}
   */
  filter(filter: string): DocumentListBuilder {
    return this.clone({options: {...this.spec.options, filter}})
  }

  /** Get Document list filter
   * @returns filter
   */
  getFilter(): string | undefined {
    return this.spec.options?.filter
  }

  /** Set Document list schema type name
   * @param type - schema type name.
   * @returns document list builder based on the schema type name provided. See {@link DocumentListBuilder}
   */
  schemaType(type: SchemaType | string): DocumentListBuilder {
    const schemaTypeName = typeof type === 'string' ? type : type.name
    return this.clone({schemaTypeName})
  }

  /** Get Document list schema type name
   * @returns schema type name
   */
  getSchemaType(): string | undefined {
    return this.spec.schemaTypeName
  }

  /** Set Document list options' parameters
   * @param params - parameters
   * @returns document list builder based on the options provided. See {@link DocumentListBuilder}
   */
  params(params: Record<string, unknown>): DocumentListBuilder {
    return this.clone({
      options: {...(this.spec.options || {filter: ''}), params},
    })
  }

  /** Get Document list options' parameters
   * @returns options
   */
  getParams(): Record<string, unknown> | undefined {
    return this.spec.options?.params
  }

  /** Set Document list default ordering
   * @param ordering - default sort ordering array. See {@link SortOrderingItem}
   * @returns document list builder based on ordering provided. See {@link DocumentListBuilder}
   */
  defaultOrdering(ordering: SortOrderingItem[]): DocumentListBuilder {
    if (!Array.isArray(ordering)) {
      throw new Error('`defaultOrdering` must be an array of order clauses')
    }

    return this.clone({
      options: {...(this.spec.options || {filter: ''}), defaultOrdering: ordering},
    })
  }

  /** Get Document list default ordering
   * @returns default ordering. See {@link SortOrderingItem}
   */
  getDefaultOrdering(): SortOrderingItem[] | undefined {
    return this.spec.options?.defaultOrdering
  }

  /** Serialize Document list
   * @param options - serialization options. See {@link SerializeOptions}
   * @returns document list object based on path provided in options. See {@link DocumentList}
   */
  serialize(options: SerializeOptions = {path: []}): DocumentList {
    if (typeof this.spec.id !== 'string' || !this.spec.id) {
      throw new SerializeError(
        '`id` is required for document lists',
        options.path,
        options.index,
        this.spec.title,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!this.spec.options || !this.spec.options.filter) {
      throw new SerializeError(
        '`filter` is required for document lists',
        options.path,
        this.spec.id,
        this.spec.title,
      ).withHelpUrl(HELP_URL.FILTER_REQUIRED)
    }

    const hasSimpleFilter = this.spec.options?.filter === '_type == $type'
    if (!hasSimpleFilter && this.spec.options.filter && !this.spec.options.apiVersion) {
      console.warn(
        `No apiVersion specified for document type list with custom filter: \`${this.spec.options.filter}\`. This will be required in the future. See %s for more info.`,
        generateHelpUrl(HELP_URL.API_VERSION_REQUIRED_FOR_CUSTOM_FILTER),
      )
    }
    return {
      ...super.serialize(options),
      type: 'documentList',
      schemaTypeName: this.spec.schemaTypeName,
      child: this.spec.child || createDocumentChildResolverForItem(this._context),
      options: {
        ...this.spec.options,
        // @todo: make specifying .apiVersion required when using custom (non-simple) filters in v4
        apiVersion: this.spec.options.apiVersion || DEFAULT_STUDIO_CLIENT_OPTIONS.apiVersion,
        filter: validateFilter(this.spec, options),
      },
    }
  }

  /** Clone Document list builder (allows for options overriding)
   * @param withSpec - override document list spec. See {@link PartialDocumentList}
   * @returns document list builder. See {@link DocumentListBuilder}
   */
  clone(withSpec?: PartialDocumentList): DocumentListBuilder {
    const builder = new DocumentListBuilder(this._context)
    builder.spec = {...this.spec, ...withSpec}

    if (!this.initialValueTemplatesSpecified) {
      builder.spec.initialValueTemplates = inferInitialValueTemplates(this._context, builder.spec)
    }

    if (!builder.spec.schemaTypeName) {
      builder.spec.schemaTypeName = inferTypeName(builder.spec)
    }

    return builder
  }

  /** Get Document list spec
   * @returns document list spec. See {@link PartialDocumentList}
   */
  getSpec(): PartialDocumentList {
    return this.spec
  }
}

function inferInitialValueTemplates(
  context: StructureContext,
  spec: PartialDocumentList,
): InitialValueTemplateItem[] | undefined {
  const {document} = context
  const {schemaTypeName, options} = spec
  const {filter, params} = options || {filter: '', params: {}}
  const typeNames = schemaTypeName
    ? [schemaTypeName]
    : Array.from(new Set(getTypeNamesFromFilter(filter, params)))

  if (typeNames.length === 0) {
    return undefined
  }

  return typeNames
    .flatMap((schemaType) =>
      document.resolveNewDocumentOptions({
        type: 'structure',
        schemaType,
      }),
    )
    .map((option) => ({...option, icon: AddIcon}))
}

function inferTypeName(spec: PartialDocumentList): string | undefined {
  const {options} = spec
  const {filter, params} = options || {filter: '', params: {}}
  const typeNames = getTypeNamesFromFilter(filter, params)
  return typeNames.length === 1 ? typeNames[0] : undefined
}

/** @internal */
export function getTypeNamesFromFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string[] {
  let typeNames = getTypeNamesFromEqualityFilter(filter, params)

  if (typeNames.length === 0) {
    typeNames = getTypeNamesFromInTypesFilter(filter, params)
  }

  return typeNames
}

// From _type == "movie" || _type == $otherType
function getTypeNamesFromEqualityFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string[] {
  const pattern =
    /\b_type\s*==\s*(['"].*?['"]|\$.*?(?:\s|$))|\B(['"].*?['"]|\$.*?(?:\s|$))\s*==\s*_type/g
  const matches: string[] = []
  let match
  while ((match = pattern.exec(filter)) !== null) {
    matches.push(match[1] || match[2])
  }

  return matches
    .map((candidate) => {
      const typeName = candidate[0] === '$' ? params[candidate.slice(1)] : candidate
      const normalized = ((typeName as string) || '').trim().replace(/^["']|["']$/g, '')
      return normalized
    })
    .filter(Boolean)
}

// From _type in ["dog", "cat", $otherSpecies]
function getTypeNamesFromInTypesFilter(
  filter: string,
  params: Record<string, unknown> = {},
): string[] {
  const pattern = /\b_type\s+in\s+\[(.*?)\]/
  const matches = filter.match(pattern)
  if (!matches) {
    return []
  }

  return matches[1]
    .split(/,\s*/)
    .map((match) => match.trim().replace(/^["']+|["']+$/g, ''))
    .map((item) => (item[0] === '$' ? params[item.slice(1)] : item))
    .filter(Boolean) as string[]
}
