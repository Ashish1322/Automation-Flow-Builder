// @ts-nocheck: Disable
import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord_connections";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion_connections";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack_connections";
import { db } from "@/lib/db";
import axios from "axios";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  console.log("ACCESS Entering");
  const headersList = headers();
  let channelResourceId;
  headersList.forEach((value, key) => {
    if (key == "x-goog-resource-id") {
      channelResourceId = value;
    }
  });
  console.log("ACCESS channelId", channelResourceId);
  if (channelResourceId) {
    const user = await db.user.findFirst({
      where: {
        googleResourceId: channelResourceId,
      },
      select: { clerkId: true, credits: true },
    });
    if ((user && parseInt(user.credits!) > 0) || user?.credits == "Unlimited") {
      const workflow = await db.workflows.findMany({
        where: {
          userId: user.clerkId,
        },
      });
      if (workflow) {
        console.log("ACCESS worflow");
        workflow.map(async (flow) => {
          if (flow.flowPath == null) return;
          const flowPath = JSON.parse(flow.flowPath!);
          const current = 0;
          while (flowPath.length > 0) {
            console.log("Flow Path", flowPath);
            if (flowPath[current] == "Discord") {
              console.log("ACCESS Discord");
              const discordMessage = await db.discordWebhook.findFirst({
                where: {
                  userId: flow.userId,
                },
                select: {
                  url: true,
                },
              });
              console.log("ACCESS Discord Message : ", discordMessage);
              if (discordMessage) {
                await postContentToWebHook(
                  flow.discordTemplate!,
                  discordMessage.url
                );
                flowPath.splice(flowPath[current], 1);
              }
            }
            if (flowPath[current] == "Slack") {
              console.log("ACCESS Slack");
              const channels = flow.slackChannels.map((channel) => {
                return {
                  label: "",
                  value: channel,
                };
              });
              console.log("ACCESS channels", channels);
              await postMessageToSlack(
                flow.slackAccessToken!,
                channels,
                flow.slackTemplate!
              );
              flowPath.splice(flowPath[current], 1);
            }
            if (flowPath[current] == "Notion") {
              await onCreateNewPageInDatabase(
                flow.notionDbId!,
                flow.notionAccessToken!,
                JSON.parse(flow.notionTemplate!)
              );
              flowPath.splice(flowPath[current], 1);
            }

            if (flowPath[current] == "Wait") {
              const res = await axios.put(
                "https://api.cron-job.org/jobs",
                {
                  job: {
                    url: `${process.env.NGROK_URI}?flow_id=${flow.id}`,
                    enabled: "true",
                    schedule: {
                      timezone: "Europe/Istanbul",
                      expiresAt: 0,
                      hours: [-1],
                      mdays: [-1],
                      minutes: ["*****"],
                      months: [-1],
                      wdays: [-1],
                    },
                  },
                },
                {
                  headers: {
                    Authorization: `Bearer ${process.env.CRON_JOB_KEY!}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              if (res) {
                flowPath.splice(flowPath[current], 1);
                const cronPath = await db.workflows.update({
                  where: {
                    id: flow.id,
                  },
                  data: {
                    cronPath: JSON.stringify(flowPath),
                  },
                });
                if (cronPath) break;
              }
              break;
            }
            console.log("Flow Path and Current", flowPath, current);
          }

          await db.user.update({
            where: {
              clerkId: user.clerkId,
            },
            data: {
              credits: `${parseInt(user.credits!) - 1}`,
            },
          });
        });
        return Response.json(
          {
            message: "flow completed",
          },
          {
            status: 200,
          }
        );
      }
    }
  }
  return Response.json(
    {
      message: "success",
    },
    {
      status: 200,
    }
  );
}
