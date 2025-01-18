"use client";
import React, { useEffect } from "react";
import ConnectionCard from "@/app/(main)/(pages)/connections/_components/connection-card";
import { AccordionContent } from "@/components/ui/accordion";
import MultipleSelector from "@/components/ui/multiple-selector";
import { Connection } from "@/lib/types";
import { EditorState } from "@/providers/editor-provider";
import { useFuzzieStore } from "@/store";
import { useNodeConnections } from "@/providers/connection-provider";
import { getWorflowSlackChannels } from "../_actions/workflow-connections";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
];

const RenderConnectionAccordion = ({
  connection,
  state,
}: {
  connection: Connection;
  state: EditorState;
}) => {
  const {
    title,
    image,
    description,
    connectionKey,
    accessTokenKey,
    alwaysTrue,
    slackSpecial,
  } = connection;

  const { nodeConnection } = useNodeConnections();
  const { slackChannels, selectedSlackChannels, setSelectedSlackChannels } =
    useFuzzieStore();

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const connectionData = (nodeConnection as any)[connectionKey];

  const isConnected =
    alwaysTrue ||
    (nodeConnection[connectionKey] &&
      accessTokenKey &&
      connectionData[accessTokenKey!]);

  // Fetch the slack channels for current template
  const pathname = usePathname();
  const fetchSlackChannesl = async () => {
    setLoading(true);
    try {
      const workflowId = pathname.split("/").pop()!;
      const flowSlackChannels = await getWorflowSlackChannels(workflowId);
      if (slackChannels) {
        let temp = slackChannels.filter((item: any) => {
          if (flowSlackChannels.includes(item?.value)) {
            return item;
          }
        });
        setSelectedSlackChannels(temp);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toast.error("Something Went Wrong !");
    }
  };

  useEffect(() => {
    if (slackSpecial && isConnected) {
      fetchSlackChannesl();
    }
  }, [slackSpecial, isConnected]);

  return (
    <AccordionContent key={title}>
      {state.editor.selectedNode.data.title === title && (
        <>
          <ConnectionCard
            title={title}
            icon={image}
            description={description}
            type={title}
            connected={{ [title]: isConnected }}
          />
          {slackSpecial && isConnected && (
            <div className="p-6">
              {slackChannels?.length ? (
                <>
                  <div className="mb-4 ml-1">
                    Select the slack channels to send notification and messages:
                  </div>
                  <MultipleSelector
                    value={selectedSlackChannels}
                    onChange={setSelectedSlackChannels}
                    defaultOptions={slackChannels}
                    placeholder="Select channels"
                    emptyIndicator={
                      <p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">
                        no results found.
                      </p>
                    }
                  />
                </>
              ) : (
                <>
                  {loading == true
                    ? "Fetching details..."
                    : "No Slack channels found. Please add your Slack bot to your Slack channel"}
                </>
              )}
            </div>
          )}
        </>
      )}
    </AccordionContent>
  );
};

export default RenderConnectionAccordion;
