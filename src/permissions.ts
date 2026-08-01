import { shield } from "graphql-shield";

import { resolveGraphqlShieldMutationAccess, resolveGraphqlShieldQueryAccess } from "./graphql-field-permissions";
import mutationFields from "./schema/mutations";
import queryFields from "./schema/query";

const queries = Object.keys(queryFields);
const rulesForSchemaQueryFields = Object.fromEntries(
  queries.map((field) => [field, resolveGraphqlShieldQueryAccess(field)]),
);

const mutations = Object.keys(mutationFields);
const rulesForSchemaMutationFields = Object.fromEntries(
  mutations.map((field) => [field, resolveGraphqlShieldMutationAccess(field)]),
);

export const servicePermissions = shield(
  {
    Query: rulesForSchemaQueryFields,
    Mutation: rulesForSchemaMutationFields,
  },
  {
    allowExternalErrors: true,
  },
);
