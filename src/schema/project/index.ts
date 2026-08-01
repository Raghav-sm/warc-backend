import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { DateTimeScalar } from "graphql-date-scalars";

import PaginationType from "schema/pagination/pagination";
import PermissionEnumType from "schema/role/enum/permissions";

import ProjectStatusEnumType from "./enum/project-status";

export const ProjectMemberType = new GraphQLObjectType({
  name: "ProjectMemberType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    userId: { type: new GraphQLNonNull(GraphQLID) },
    firstName: { type: new GraphQLNonNull(GraphQLString) },
    lastName: { type: new GraphQLNonNull(GraphQLString) },
    email: { type: new GraphQLNonNull(GraphQLString) },
    fullName: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (member) => [member.firstName, member.lastName].filter(Boolean).join(" "),
    },
    roleId: { type: new GraphQLNonNull(GraphQLID) },
    roleCode: { type: new GraphQLNonNull(GraphQLString) },
    roleName: { type: new GraphQLNonNull(GraphQLString) },
    joinedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const ProjectMembersType = new GraphQLObjectType({
  name: "ProjectMembersType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ProjectMemberType))) },
  }),
});

export const ProjectType = new GraphQLObjectType({
  name: "ProjectType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    status: { type: new GraphQLNonNull(ProjectStatusEnumType) },
    ownerId: { type: new GraphQLNonNull(GraphQLID) },
    progressPercent: { type: new GraphQLNonNull(GraphQLInt) },
    memberCount: { type: new GraphQLNonNull(GraphQLInt) },
    myPermissions: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PermissionEnumType))),
    },
    myRoleName: { type: GraphQLString },
    myRoleCode: { type: GraphQLString },
    createdAt: { type: new GraphQLNonNull(DateTimeScalar) },
    updatedAt: { type: new GraphQLNonNull(DateTimeScalar) },
  }),
});

export const ProjectsType = new GraphQLObjectType({
  name: "ProjectsType",
  fields: () => ({
    nodes: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ProjectType))) },
    pageInfo: { type: new GraphQLNonNull(PaginationType) },
  }),
});
