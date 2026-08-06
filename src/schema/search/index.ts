import {
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

import ProjectStatusEnumType from "schema/project/enum/project-status";
import TaskStatusEnumType from "schema/task/enum/task-status";

export const ProjectSearchHitType = new GraphQLObjectType({
  name: "ProjectSearchHitType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(ProjectStatusEnumType) },
  }),
});

export const TaskSearchHitType = new GraphQLObjectType({
  name: "TaskSearchHitType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(TaskStatusEnumType) },
  }),
});

export const CommentSearchHitType = new GraphQLObjectType({
  name: "CommentSearchHitType",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLID) },
    bodySnippet: { type: new GraphQLNonNull(GraphQLString) },
    taskId: { type: new GraphQLNonNull(GraphQLID) },
    taskTitle: { type: new GraphQLNonNull(GraphQLString) },
    projectId: { type: new GraphQLNonNull(GraphQLID) },
    projectName: { type: new GraphQLNonNull(GraphQLString) },
  }),
});

export const SearchResultsType = new GraphQLObjectType({
  name: "SearchResultsType",
  fields: () => ({
    projects: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ProjectSearchHitType))) },
    tasks: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(TaskSearchHitType))) },
    comments: { type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(CommentSearchHitType))) },
  }),
});
