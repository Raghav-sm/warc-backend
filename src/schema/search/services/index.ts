import { getPrismaInstance } from "datasources/prisma";
import type { GlobalSearchInputType } from "interfaces/search";

const prisma = getPrismaInstance();

const SNIPPET_MAX_LENGTH = 120;

function truncateSnippet(value: string): string {
  if (value.length <= SNIPPET_MAX_LENGTH) {
    return value;
  }
  return `${value.slice(0, SNIPPET_MAX_LENGTH).trim()}…`;
}

export async function globalSearch(input: GlobalSearchInputType) {
  const term = input.query.trim();
  if (term.length < 2) {
    return { projects: [], tasks: [], comments: [] };
  }

  const limit = input.limit;
  const pattern = { contains: term, mode: "insensitive" as const };
  const memberFilter = { members: { some: { userId: input.userId } } };

  const [projects, tasks, comments] = await Promise.all([
    prisma.project.findMany({
      where: {
        deletedAt: null,
        ...memberFilter,
        name: pattern,
      },
      select: { id: true, name: true, status: true },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        project: {
          deletedAt: null,
          ...memberFilter,
        },
        OR: [{ title: pattern }, { description: pattern }],
      },
      select: {
        id: true,
        title: true,
        status: true,
        projectId: true,
        project: { select: { name: true } },
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.comment.findMany({
      where: {
        deletedAt: null,
        body: pattern,
        task: {
          deletedAt: null,
          project: {
            deletedAt: null,
            ...memberFilter,
          },
        },
      },
      select: {
        id: true,
        body: true,
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: { select: { name: true } },
          },
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    projects,
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
      status: task.status,
    })),
    comments: comments.map((comment) => ({
      id: comment.id,
      bodySnippet: truncateSnippet(comment.body),
      taskId: comment.task.id,
      taskTitle: comment.task.title,
      projectId: comment.task.projectId,
      projectName: comment.task.project.name,
    })),
  };
}
