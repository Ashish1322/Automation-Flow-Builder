"use server";

import { db } from "@/lib/db";

export const onCreateNodesEdges = async (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath: string
) => {
  const flow = await db.workflows.update({
    where: {
      id: flowId,
    },
    data: {
      nodes,
      edges,
      flowPath: flowPath,
    },
  });

  if (flow) return { message: "flow saved" };
};

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  console.log(state);
  const published = await db.workflows.update({
    where: {
      id: workflowId,
    },
    data: {
      publish: state,
    },
  });

  if (published.publish) return "Workflow published";
  return "Workflow unpublished";
};

export const getWorflowSlackChannels = async (flowId: string) => {
  const slackChannels = await db.workflows.findUnique({
    where: {
      id: flowId,
    },
    select: {
      slackChannels: true,
    },
  });
  if (slackChannels && slackChannels?.slackChannels)
    return slackChannels.slackChannels;
  return [];
};

export const getWorflowSlackMessage = async (flowId: string) => {
  const slackTemplate = await db.workflows.findUnique({
    where: {
      id: flowId,
    },
    select: {
      slackTemplate: true,
    },
  });
  if (slackTemplate) return slackTemplate.slackTemplate;
  return null;
};
