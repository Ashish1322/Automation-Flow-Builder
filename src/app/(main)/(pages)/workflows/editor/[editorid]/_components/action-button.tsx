"use client";
import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord_connections";
import { Button } from "@/components/ui/button";
import { ConnectionProviderProps } from "@/providers/connection-provider";
import React, { useCallback, useState } from "react";
import { onCreateNodeTemplate } from "../../../_actions/workflow-connections";
import { Option } from "./content-based-on-title";
import { toast } from "sonner";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion_connections";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack_connections";
import { usePathname } from "next/navigation";
type Props = {
  currentService: string;
  nodeConnection: ConnectionProviderProps;
  channels?: Option[];
  setChannels?: (value: Option[]) => void;
};

const ActionButton = ({
  currentService,
  nodeConnection,
  channels,
  setChannels,
}: Props) => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);

  function startLoading(test = false) {
    if (test) setIsTestLoading(true);
    else setIsLoading(true);
  }
  function stopLoading(test = false) {
    if (test) setIsTestLoading(false);
    else setIsLoading(false);
  }
  const onSendDiscordMessage = useCallback(async () => {
    startLoading();
    const response = await postContentToWebHook(
      nodeConnection.discordNode.content,
      nodeConnection.discordNode.webhookURL
    );

    if (response.message == "success") {
      nodeConnection.setDiscordNode((prev: any) => ({
        ...prev,
        content: "",
      }));
    }
    stopLoading();
  }, [nodeConnection.discordNode]);

  const onCreateLocalNodeTempate = useCallback(async () => {
    startLoading(true);
    if (currentService === "Discord") {
      const response = await onCreateNodeTemplate(
        nodeConnection.discordNode.content,
        currentService,
        pathname.split("/").pop()!
      );

      if (response) {
        toast.message(response);
      }
    }
    if (currentService === "Slack") {
      if (channels?.length == 0) {
        toast.error("Please select channel");
      } else if (nodeConnection.slackNode.content == "") {
        toast.error("Content cannot be empty");
      } else {
        const response = await onCreateNodeTemplate(
          nodeConnection.slackNode.content,
          currentService,
          pathname.split("/").pop()!,
          channels,
          nodeConnection.slackNode.slackAccessToken
        );

        if (response) {
          toast.message(response);
        }
      }
    }

    if (currentService === "Notion") {
      const response = await onCreateNodeTemplate(
        JSON.stringify(nodeConnection.notionNode.content),
        currentService,
        pathname.split("/").pop()!,
        [],
        nodeConnection.notionNode.accessToken,
        nodeConnection.notionNode.databaseId
      );

      if (response) {
        toast.message(response);
      }
    }
    stopLoading(true);
  }, [nodeConnection, channels]);

  const onStoreNotionContent = useCallback(async () => {
    startLoading();
    console.log(
      nodeConnection.notionNode.databaseId,
      nodeConnection.notionNode.accessToken,
      nodeConnection.notionNode.content
    );
    const response = await onCreateNewPageInDatabase(
      nodeConnection.notionNode.databaseId,
      nodeConnection.notionNode.accessToken,
      nodeConnection.notionNode.content
    );
    if (response) {
      nodeConnection.setNotionNode((prev: any) => ({
        ...prev,
        content: "",
      }));
    }
    stopLoading();
  }, [nodeConnection.notionNode]);

  const onStoreSlackContent = useCallback(async () => {
    startLoading();
    const response = await postMessageToSlack(
      nodeConnection.slackNode.slackAccessToken,
      channels!,
      nodeConnection.slackNode.content
    );
    if (response.message == "Success") {
      toast.success("Message sent successfully");
      nodeConnection.setSlackNode((prev: any) => ({
        ...prev,
        content: "",
      }));
      setChannels!([]);
    } else {
      toast.error(response.message);
    }
    stopLoading();
  }, [nodeConnection.slackNode, channels]);

  const renderActionButton = () => {
    switch (currentService) {
      case "Discord":
        return (
          <>
            <Button
              disabled={isLoading}
              variant="outline"
              onClick={onSendDiscordMessage}
            >
              {isLoading ? "Sending Message..." : "Send Message"}
            </Button>
            <Button
              disabled={isTestLoading}
              onClick={onCreateLocalNodeTempate}
              variant="outline"
            >
              {isTestLoading ? "Saving..." : "Save Template"}
            </Button>
          </>
        );

      case "Notion":
        return (
          <>
            <Button
              disabled={isLoading}
              variant="outline"
              onClick={onStoreNotionContent}
            >
              {isLoading ? "Testing..." : "Test"}
            </Button>
            <Button
              disabled={isTestLoading}
              onClick={onCreateLocalNodeTempate}
              variant="outline"
            >
              {isTestLoading ? "Saving..." : "Save Template"}
            </Button>
          </>
        );

      case "Slack":
        return (
          <>
            <Button
              disabled={isLoading}
              variant="outline"
              onClick={onStoreSlackContent}
            >
              {isLoading ? "Sending Message..." : "Send Message"}
            </Button>
            <Button
              disabled={isTestLoading}
              onClick={onCreateLocalNodeTempate}
              variant="outline"
            >
              {isTestLoading ? "Saving..." : "Save Template"}
            </Button>
          </>
        );

      default:
        return null;
    }
  };
  return renderActionButton();
};

export default ActionButton;
